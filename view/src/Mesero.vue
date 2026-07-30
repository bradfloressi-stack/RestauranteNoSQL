<template>
  <div class="mesero-panel">
    <!-- ENCABEZADO -->
    <header class="mesero-header">
      <div class="header-top">
        <div class="brand">
          <div>
            <div class="brand-title">Cantina Central</div>
          </div>
          <div class="user-pill">Mesero · {{ currentUser ? currentUser.nombre : '' }}</div>
        </div>
        <div class="header-actions">
          <div class="bell-wrap">
            <button class="btn-bell" @click="toggleBell">
              🔔
              <span v-if="campanitaCount > 0" class="bell-badge">{{ campanitaCount }}</span>
            </button>
            <div v-if="showBellDropdown" class="bell-dropdown">
              <div class="bell-title">Listas en ventanilla</div>
              <div v-if="platillosListos.length === 0" class="empty-msg-sm">Nada pendiente por ahora.</div>
              <div v-for="(item, i) in platillosListos" :key="i" class="bell-item">
                Mesa {{ item.mesaNumero }} — {{ item.qty }}x {{ item.nombre }}
              </div>
            </div>
          </div>
          <button class="btn-ghost" @click="salir">Salir</button>
        </div>
      </div>
    </header>

    <div v-if="!caja.abierta" class="banner-warning">
      La caja está cerrada — no se pueden tomar nuevas órdenes hasta que el administrador la abra.
    </div>

    <div class="toolbar">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: tab === 'tablero' }" @click="tab = 'tablero'">Tablero</button>
        <button class="tab-btn" :class="{ active: tab === 'pagadas' }" @click="tab = 'pagadas'">
          Pagadas del turno ({{ ordenesPagadasTurno.length }})
        </button>
      </div>
      <button
        class="btn-gold"
        :disabled="!caja.abierta"
        :title="!caja.abierta ? 'Abre la caja antes de tomar órdenes' : ''"
        @click="abrirNuevaOrden"
      >+ Nueva orden</button>
    </div>

    <!-- TABLERO -->
    <div v-if="tab === 'tablero'" class="content">
      <div v-if="ordenesActivas.length === 0" class="empty-msg">No hay órdenes activas en el restaurante.</div>
      <div class="orders-grid">
        <div v-for="o in ordenesActivas" :key="o._id" class="order-card">
          <div class="order-card-head">
            <div class="order-mesa-title">Mesa {{ o.mesa ? o.mesa.numero : '—' }}</div>
            <span class="tag" :class="estadoOrden(o).clase">{{ estadoOrden(o).label }}</span>
          </div>

          <div class="dish-list">
            <div v-for="(g, i) in platillosAgrupados(o)" :key="i" class="dish-line">
              <div class="dish-name">{{ g.qty }}× {{ g.nombre }}</div>
              <span class="tag tag-sm" :class="dishEstadoClase(g)">{{ dishEstadoLabel(g) }}</span>
              <button
                v-if="g.estado === 'ventanilla' && !g.entregado && esMiOrden(o)"
                class="btn-mini btn-mini-green"
                @click="entregarGrupo(o, g)"
              >✓ Entregar</button>
            </div>
          </div>

          <div v-if="o.nota" class="order-nota">Nota: {{ o.nota }}</div>

          <div class="order-card-foot">
            <div class="order-meta">{{ formatTime(o.createdAt) }} · {{ money(o.total) }}</div>
            <div v-if="!esMiOrden(o)" class="tag tag-waiter">{{ o.mesero ? o.mesero.nombre : '—' }}</div>
          </div>

          <div v-if="todoEntregado(o)" class="order-delivered">✓ Orden entregada</div>
          <button
            v-else-if="esMiOrden(o)"
            class="btn-outline-full"
            @click="abrirEditarOrden(o)"
          >Editar orden</button>
        </div>
      </div>
    </div>

    <!-- PAGADAS DEL TURNO -->
    <div v-if="tab === 'pagadas'" class="content">
      <div v-if="ordenesPagadasTurno.length === 0" class="empty-msg">Aún no hay órdenes pagadas en este turno.</div>
      <div class="panel-card" v-else>
        <div v-for="o in ordenesPagadasTurno" :key="o._id" class="row-line">
          <span class="row-mesa-sm">Mesa {{ o.mesa ? o.mesa.numero : '—' }}</span>
          <span class="row-mesero-sm">{{ o.mesero ? o.mesero.nombre : '—' }}</span>
          <span class="row-time">{{ formatTime(o.updatedAt) }}</span>
          <span class="row-total-sm">{{ money(o.total) }}</span>
        </div>
      </div>
    </div>

    <!-- NUEVA / EDITAR ORDEN -->
    <div v-if="modalOrden" class="modal-overlay" @click.self="cerrarModalOrden">
      <div class="modal-box modal-wide">
        <div class="modal-head">
          <div class="modal-title-serif">{{ formOrden._id ? 'Editar orden' : 'Nueva orden' }}</div>
          <button class="btn-close" @click="cerrarModalOrden">✕</button>
        </div>

        <template v-if="!formOrden._id">
          <label class="field-label">Mesa</label>
          <select v-model="formOrden.mesaId" class="field-input">
            <option value="">Selecciona una mesa…</option>
            <option v-for="t in mesas" :key="t._id" :value="t._id" :disabled="mesaOcupada(t)">
              Mesa {{ t.numero }}{{ mesaOcupada(t) ? ' (ocupada)' : '' }}
            </option>
          </select>
        </template>
        <template v-else>
          <label class="field-label">Mesa</label>
          <div class="field-static">Mesa {{ formOrden.mesaNumero }}</div>
          <div class="field-hint">Los platillos que agregues aquí se envían como una nueva ronda a cocina.</div>
        </template>

        <label class="field-label">Platillos</label>
        <div class="menu-picker">
          <div v-for="cat in menuPorCategoria" :key="cat.nombre" class="menu-cat-block">
            <div class="cat-label">{{ cat.nombre }}</div>
            <div v-for="p in cat.items" :key="p._id" class="qty-row">
              <div class="qty-name">{{ p.nombre }}</div>
              <div class="qty-price">{{ money(p.precio) }}</div>
              <button class="btn-qty" :disabled="(formOrden.qtys[p._id] || 0) <= minQty(p._id)" @click="decQty(p._id)">−</button>
              <div class="qty-value">{{ formOrden.qtys[p._id] || 0 }}</div>
              <button class="btn-qty" @click="incQty(p._id)">+</button>
            </div>
          </div>
        </div>

        <label class="field-label">Notas especiales (opcional)</label>
        <textarea v-model="formOrden.nota" class="field-input field-textarea" placeholder="Ej. sin cebolla, término medio…"></textarea>

        <div v-if="formOrden.error" class="field-error">{{ formOrden.error }}</div>

        <div class="modal-foot">
          <div class="modal-foot-total">{{ draftItemCount }} platillos · <b>{{ money(draftTotal) }}</b></div>
          <button class="btn-solid-gold" @click="guardarOrden">Enviar a cocina →</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'Mesero',
  data() {
    return {
      API_URL,
      currentUser: null,
      tab: 'tablero',

      caja: { abierta: false, base: 0, ventas: 0, entradas: 0, salidas: 0, efectivoEnCaja: 0, desde: null },
      ordenes: [],
      mesas: [],
      menu: [],
      categorias: [],

      showBellDropdown: false,

      modalOrden: false,
      formOrden: { _id: null, mesaId: '', mesaNumero: '', qtys: {}, snapshotQtys: {}, nota: '', error: '' },

      toast: null,
      _pollTimer: null,
    }
  },

  computed: {
    ordenesActivas() {
      return this.ordenes.filter(o => !o.pagada)
    },
    ordenesPagadasTurno() {
      if (!this.caja.abierta || !this.caja.desde) return []
      const desde = new Date(this.caja.desde).getTime()
      return this.ordenes
        .filter(o => o.pagada && new Date(o.updatedAt).getTime() >= desde)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    },
    menuPorCategoria() {
      const grupos = {}
      this.menu.forEach(p => {
        const nombreCat = p.categoria ? p.categoria.nombre : 'Sin categoría'
        if (!grupos[nombreCat]) grupos[nombreCat] = []
        grupos[nombreCat].push(p)
      })
      return Object.keys(grupos).sort().map(nombre => ({ nombre, items: grupos[nombre] }))
    },
    platillosListos() {
      const items = []
      this.ordenesActivas.filter(o => this.esMiOrden(o)).forEach(o => {
        this.platillosAgrupados(o).forEach(g => {
          if (g.estado === 'ventanilla' && !g.entregado) {
            items.push({ mesaNumero: o.mesa ? o.mesa.numero : '—', nombre: g.nombre, qty: g.qty })
          }
        })
      })
      return items
    },
    campanitaCount() {
      return this.platillosListos.length
    },
    draftDiffEntries() {
      return Object.entries(this.formOrden.qtys)
        .map(([id, qty]) => [id, qty - this.minQty(id)])
        .filter(([, diff]) => diff > 0)
    },
    draftTotal() {
      return this.draftDiffEntries.reduce((suma, [id, diff]) => {
        const p = this.menu.find(m => m._id === id)
        return suma + (p ? p.precio * diff : 0)
      }, 0)
    },
    draftItemCount() {
      return this.draftDiffEntries.reduce((suma, [, diff]) => suma + diff, 0)
    },
  },

  created() {
    const raw = localStorage.getItem('usuario')
    this.currentUser = raw ? JSON.parse(raw) : null
    this.cargarCaja()
    this.cargarOrdenes()
    this.cargarMesas()
    this.cargarMenu()
    this.cargarCategorias()
    // refresca las órdenes cada 8s para ver cambios hechos por cocina/caja 
    this._pollTimer = setInterval(() => {
      this.cargarOrdenes()
      this.cargarCaja()
    }, 8000)
  },

  beforeUnmount() {
    clearInterval(this._pollTimer)
  },

  methods: {
    // ---------- utilidades ----------
    money(n) {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
    },
    formatTime(ts) {
      return ts ? new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
    },
    showToast(msg) {
      this.toast = msg
      clearTimeout(this._toastTimer)
      this._toastTimer = setTimeout(() => { this.toast = null }, 2500)
    },
    async peticion(path, options = {}) {
      const res = await fetch(`${this.API_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.mensaje || 'Ocurrió un error con el servidor')
      return data
    },
    salir() {
      localStorage.removeItem('usuario')
      this.$router.push('/')
    },
    toggleBell() {
      this.showBellDropdown = !this.showBellDropdown
    },

    // ---------- carga de datos ----------
    async cargarCaja() {
      try {
        const data = await this.peticion('/caja/estado')
        this.caja = { abierta: false, base: 0, ventas: 0, entradas: 0, salidas: 0, efectivoEnCaja: 0, desde: null, ...data }
      } catch (e) { this.showToast(e.message) }
    },
    async cargarOrdenes() {
      try { this.ordenes = await this.peticion('/ordenes') }
      catch (e) { this.showToast(e.message) }
    },
    async cargarMesas() {
      try { this.mesas = await this.peticion('/mesas') }
      catch (e) { this.showToast(e.message) }
    },
    async cargarMenu() {
      try { this.menu = await this.peticion('/menu') }
      catch (e) { this.showToast(e.message) }
    },
    async cargarCategorias() {
      try { this.categorias = await this.peticion('/categorias') }
      catch (e) { this.showToast(e.message) }
    },

    // ---------- helpers de orden ----------
    esMiOrden(o) {
      return !!(o.mesero && this.currentUser && o.mesero._id === this.currentUser.id)
    },
    todoEntregado(o) {
      return o.platillos.length > 0 && o.platillos.every(p => p.entregado)
    },
    platillosAgrupados(o) {
      const grupos = {}
      o.platillos.forEach(p => {
        const key = `${p.nombre}|${p.estado}|${p.entregado}`
        if (!grupos[key]) grupos[key] = { nombre: p.nombre, estado: p.estado, entregado: p.entregado, qty: 0, ids: [] }
        grupos[key].qty += 1
        grupos[key].ids.push(p._id)
      })
      return Object.values(grupos)
    },
    dishEstadoLabel(g) {
      if (g.entregado) return 'Entregado'
      return { proceso: 'Pendiente', cocinado: 'En proceso', ventanilla: 'En ventanilla' }[g.estado] || g.estado
    },
    dishEstadoClase(g) {
      if (g.entregado) return 'tag-green'
      return { proceso: 'tag-amber', cocinado: 'tag-status', ventanilla: 'tag-purple' }[g.estado] || 'tag-status'
    },
    estadoOrden(o) {
      if (this.todoEntregado(o)) return { label: 'Entregada', clase: 'tag-green' }
      const estados = o.platillos.map(p => p.estado)
      if (estados.every(e => e === 'ventanilla')) return { label: 'En ventanilla', clase: 'tag-purple' }
      if (estados.some(e => e === 'cocinado' || e === 'ventanilla')) return { label: 'En proceso', clase: 'tag-status' }
      return { label: 'Pendiente', clase: 'tag-amber' }
    },
    async entregarGrupo(o, g) {
      try {
        await Promise.all(g.ids.map(id => this.peticion(`/ordenes/${o._id}/platillos/${id}/entregar`, { method: 'PUT' })))
        this.showToast('Platillo marcado como entregado.')
        await this.cargarOrdenes()
      } catch (e) { this.showToast(e.message) }
    },

    // ---------- mesas ----------
    mesaOcupada(t) {
      return this.ordenesActivas.some(o => o.mesa && o.mesa._id === t._id && o._id !== this.formOrden._id)
    },

    // ---------- nueva / editar orden ----------
    abrirNuevaOrden() {
      if (!this.caja.abierta) { this.showToast('No puedes tomar órdenes: la caja está cerrada.'); return }
      this.formOrden = { _id: null, mesaId: '', mesaNumero: '', qtys: {}, snapshotQtys: {}, nota: '', error: '' }
      this.modalOrden = true
    },
    abrirEditarOrden(o) {
      const snapshot = {}
      o.platillos.forEach(p => { snapshot[p.menu] = (snapshot[p.menu] || 0) + 1 })
      this.formOrden = {
        _id: o._id, mesaId: o.mesa ? o.mesa._id : '', mesaNumero: o.mesa ? o.mesa.numero : '',
        qtys: { ...snapshot }, snapshotQtys: snapshot, nota: o.nota || '', error: '',
      }
      this.modalOrden = true
    },
    cerrarModalOrden() {
      this.modalOrden = false
    },
    // Al editar una orden ya existente no se puede bajar de lo que ya se pido
    minQty(id) {
      return this.formOrden._id ? (this.formOrden.snapshotQtys[id] || 0) : 0
    },
    incQty(id) {
      this.formOrden.qtys = { ...this.formOrden.qtys, [id]: (this.formOrden.qtys[id] || 0) + 1 }
    },
    decQty(id) {
      const actual = this.formOrden.qtys[id] || 0
      if (actual <= this.minQty(id)) return
      this.formOrden.qtys = { ...this.formOrden.qtys, [id]: actual - 1 }
    },
    async guardarOrden() {
      // draftDiffEntries ya calcula lo nuevo a mandar
      const entries = this.draftDiffEntries

      if (entries.length === 0) {
        this.formOrden.error = this.formOrden._id ? 'Agrega al menos un platillo más.' : 'Agrega al menos un platillo.'
        return
      }

      const platillos = []
      entries.forEach(([menuId, qty]) => {
        for (let i = 0; i < qty; i++) platillos.push({ menu: menuId })
      })

      try {
        if (this.formOrden._id) {
          await this.peticion(`/ordenes/${this.formOrden._id}/platillos`, {
            method: 'PUT',
            body: JSON.stringify({ platillos, nota: this.formOrden.nota }),
          })
          this.showToast('Orden actualizada y enviada a cocina.')
        } else {
          if (!this.formOrden.mesaId) { this.formOrden.error = 'Selecciona una mesa.'; return }
          await this.peticion('/ordenes', {
            method: 'POST',
            body: JSON.stringify({
              mesa: this.formOrden.mesaId, mesero: this.currentUser?.id, platillos, nota: this.formOrden.nota,
            }),
          })
          this.showToast('Orden enviada a cocina.')
        }
        this.modalOrden = false
        await this.cargarOrdenes()
      } catch (e) { this.formOrden.error = e.message }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');

.mesero-panel {
  min-height: 100vh;
  background: #f5f2ee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1f2937;
}

/* ---------- header ---------- */
.mesero-header { background: #2f4d3a; color: #fff; }
.header-top { padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.brand { display: flex; align-items: center; gap: 14px; }
.brand-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; font-style: italic; line-height: 1.1; }
.user-pill { font-size: 13px; background: rgba(255,255,255,0.14); padding: 4px 10px; border-radius: 999px; color: #dcead9; }
.header-actions { display: flex; align-items: center; gap: 10px; }

.bell-wrap { position: relative; }
.btn-bell {
  position: relative; width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.18); color: #fff; cursor: pointer; font-size: 16px;
}
.btn-bell:hover { background: rgba(255,255,255,0.3); }
.bell-badge {
  position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 4px;
  border-radius: 999px; background: #6b4f8f; color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.bell-dropdown {
  position: absolute; top: 46px; right: 0; width: 240px; background: #fff; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18); padding: 10px; z-index: 40; color: #1f2937;
}
.bell-title { font-size: 12px; font-weight: 700; color: #6b7280; padding: 4px 6px 8px; }
.bell-item { padding: 8px 6px; font-size: 13.5px; border-top: 1px solid #f3f4f6; }
.empty-msg-sm { padding: 8px 6px; font-size: 13px; color: #9ca3af; }

.btn-ghost { font-size: 12px; padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.4); background: transparent; color: #fff; cursor: pointer; }
.btn-ghost:hover { background: rgba(255,255,255,0.1); }

.banner-warning { background: #5c342a; color: #f0d9cf; padding: 10px 28px; font-size: 13.5px; font-weight: 600; }

/* ---------- toolbar / tabs ---------- */
.toolbar { padding: 20px 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.tabs { display: flex; gap: 8px; }
.tab-btn { padding: 9px 16px; border-radius: 9px; border: 1px solid #d7e4d0; background: #fff; color: #4d6b45; font-weight: 600; font-size: 14px; cursor: pointer; }
.tab-btn.active { background: #2f4d3a; color: #fff; border-color: #2f4d3a; }
.btn-gold { padding: 11px 20px; border-radius: 10px; border: none; background: #e8c88a; color: #2f4d3a; font-weight: 700; font-size: 14.5px; cursor: pointer; }
.btn-gold:hover:not(:disabled) { background: #f0d9a8; }
.btn-gold:disabled { background: #c9ccd1; color: #fff; cursor: not-allowed; }

/* ---------- content ---------- */
.content { padding: 0 28px 40px; }
.empty-msg { padding: 60px 20px; text-align: center; color: #9ca3af; font-size: 14.5px; }

.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.order-card { background: #fff; border-radius: 14px; padding: 16px; border: 1px solid #ece5dd; box-shadow: 0 1px 3px rgba(47,77,58,0.05); display: flex; flex-direction: column; }
.order-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.order-mesa-title { font-size: 17px; font-weight: 700; color: #111827; }

.dish-list { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 2px; }
.dish-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
.dish-name { flex: 1; }

.order-nota { font-size: 12.5px; color: #8a6a1f; background: #faf0da; padding: 6px 8px; border-radius: 7px; margin-top: 8px; }
.order-card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; }
.order-meta { font-size: 12px; color: #9ca3af; }
.order-delivered { margin-top: 10px; text-align: center; padding: 7px; border-radius: 9px; background: #dfe8d8; color: #3f6b3a; font-weight: 600; font-size: 13px; }

.btn-outline-full { margin-top: 10px; width: 100%; padding: 9px; border-radius: 9px; border: 1px solid #c3d8b8; background: #f1f6ec; color: #5c7a4f; font-weight: 600; font-size: 13.5px; cursor: pointer; }
.btn-outline-full:hover { background: #e3efd8; }

/* ---------- tags ---------- */
.tag { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.tag-sm { font-size: 11px; padding: 2px 8px; }
.tag-green { background: #dfe8d8; color: #3f6b3a; }
.tag-amber { background: #f5e6c4; color: #8a6a1f; }
.tag-status { background: #dbe3ee; color: #3d5a80; }
.tag-purple { background: #e6ddf0; color: #6b4f8f; }
.tag-waiter { background: #f2ede6; color: #8a7a6d; }

/* ---------- pagadas (reutiliza estilos de fila tipo admin) ---------- */
.panel-card { background: #fff; border-radius: 14px; padding: 8px 20px; border: 1px solid #ece5dd; }
.row-line { display: flex; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
.row-mesa-sm { font-weight: 700; font-size: 13.5px; color: #4a332b; min-width: 70px; }
.row-mesero-sm { font-size: 13px; color: #64748b; min-width: 110px; }
.row-time { font-size: 12px; color: #94a3b8; }
.row-total-sm { font-weight: 700; font-size: 14px; color: #15803d; margin-left: auto; }

/* ---------- botones mini ---------- */
.btn-mini { padding: 3px 9px; border-radius: 7px; border: none; font-weight: 600; font-size: 11px; cursor: pointer; }
.btn-mini-green { background: #8a9b7f; color: #fff; }
.btn-mini-green:hover { background: #7a8b70; }

/* ---------- modal nueva/editar orden ---------- */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-box { background: #fff; border-radius: 16px; width: 100%; max-width: 400px; padding: 26px; }
.modal-wide { max-width: 640px; max-height: 88vh; overflow-y: auto; }
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.modal-title-serif { font-family: 'Instrument Serif', Georgia, serif; font-size: 19px; font-style: italic; color: #4a332b; }
.btn-close { border: none; background: #f3f4f6; width: 32px; height: 32px; border-radius: 9px; font-size: 16px; cursor: pointer; color: #6b7280; }
.btn-close:hover { background: #e5e7eb; }

.field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.field-input { width: 100%; box-sizing: border-box; padding: 11px 12px; border-radius: 9px; border: 1px solid #d1d5db; font-size: 15px; margin-bottom: 18px; }
.field-textarea { min-height: 60px; resize: vertical; font-family: inherit; }
.field-static { padding: 11px 12px; border-radius: 9px; background: #f3f4f6; font-size: 15px; margin-bottom: 6px; }
.field-hint { font-size: 12.5px; color: #9ca3af; margin-bottom: 18px; }
.field-error { font-size: 13px; color: #b91c1c; background: #fee2e2; padding: 8px 10px; border-radius: 8px; margin-bottom: 14px; }

.menu-picker { display: flex; flex-direction: column; gap: 16px; margin-bottom: 18px; }
.menu-cat-block { margin-bottom: 0; }
.cat-label { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
.qty-row { display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 1px solid #f3f4f6; }
.qty-name { flex: 1; font-size: 14px; color: #1f2937; }
.qty-price { font-size: 13px; color: #9ca3af; width: 60px; }
.btn-qty { width: 28px; height: 28px; border-radius: 7px; border: 1px solid #e5e7eb; background: #fff; font-size: 15px; cursor: pointer; color: #374151; }
.btn-qty:hover:not(:disabled) { background: #f3f4f6; }
.btn-qty:disabled { opacity: 0.4; cursor: not-allowed; }
.qty-value { width: 22px; text-align: center; font-weight: 700; font-size: 14px; }

.modal-foot { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid #f0f0f1; }
.modal-foot-total { font-size: 14.5px; color: #6b7280; }
.btn-solid-gold { padding: 12px 22px; border-radius: 10px; border: none; background: #d97706; color: #fff; font-weight: 700; font-size: 14.5px; cursor: pointer; }
.btn-solid-gold:hover { background: #ea8e17; }

.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #111827; color: #fff; padding: 12px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 200;
}
</style>
