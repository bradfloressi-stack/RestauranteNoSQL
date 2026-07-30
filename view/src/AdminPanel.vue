<template>
  <div class="admin-panel">
    <!-- ENCABEZADO -->
    <header class="admin-header">
      <div class="header-top">
        <div class="brand">
          <div>
            <div class="brand-title">Administración</div>
            <div class="brand-sub">Cantina Central</div>
          </div>
          <div class="user-pill">{{ currentUser ? currentUser.nombre : '' }}</div>
        </div>
        <div class="header-actions">
          <button class="btn-ghost" @click="salir">Salir</button>
        </div>
      </div>

      <div class="header-caja">
        <div>
          <div class="label-upper">Estado de caja</div>
          <div class="caja-status">
            <span class="dot" :class="caja.abierta ? 'dot-on' : 'dot-off'"></span>
            <span class="caja-status-text">{{ caja.abierta ? 'Caja abierta' : 'Caja cerrada' }}</span>
          </div>
          <div v-if="caja.abierta" class="caja-since">Abierta a las {{ formatTime(caja.desde) }}</div>
        </div>
        <div>
          <div class="label-upper">Efectivo en caja</div>
          <div class="caja-amount">{{ money(caja.abierta ? caja.efectivoEnCaja : 0) }}</div>
        </div>
        <div class="caja-cta">
          <button
            v-if="caja.abierta"
            class="btn-danger"
            :disabled="ordenesActivas.length > 0"
            :title="ordenesActivas.length > 0 ? 'Cobra o cancela las órdenes activas antes de cerrar' : ''"
            @click="pedirCierreCaja"
          >Cerrar caja</button>
          <button v-else class="btn-gold" @click="modalAbrirCaja = true">Abrir caja</button>
        </div>
      </div>
      <div v-if="caja.abierta && ordenesActivas.length > 0" class="caja-warning">
        Hay órdenes activas sin cobrar — cóbralas o cancélalas antes de cerrar caja.
      </div>
    </header>

    <div class="admin-body">
      <!-- BARRA LATERAL -->
      <aside class="admin-sidebar">
        <div class="sidebar-label">Operación</div>
        <button class="nav-btn" :class="{ active: tab === 'caja' }" @click="setTab('caja')">
        <span>Caja</span>
        </button>
        <button class="nav-btn" :class="{ active: tab === 'ordenes' }" @click="setTab('ordenes')">
        <span>Órdenes</span>
        </button>
        <div class="sidebar-divider"></div>
        <div class="sidebar-label">Configuración</div>
        <button class="nav-btn" :class="{ active: tab === 'menu' }" @click="setTab('menu')">
        <span>Menú</span>
        </button>
        <button class="nav-btn" :class="{ active: tab === 'usuarios' }" @click="setTab('usuarios')">
        <span>Usuarios</span>
        </button>
        <button class="nav-btn" :class="{ active: tab === 'mesas' }" @click="setTab('mesas')">
        <span>Mesas</span>
        </button>
      </aside>

      <!-- CONTENIDO -->
      <main class="admin-main">
        <!-- CAJA -->
        <section v-if="tab === 'caja'" class="panel-card">
          <div class="panel-head">
            <div class="panel-title">Movimientos de caja</div>
            <div class="panel-head-actions">
              <button class="btn-mini btn-mini-green" :disabled="!caja.abierta" @click="abrirModalMov('entrada')">+ Ingreso</button>
              <button class="btn-mini btn-mini-red" :disabled="!caja.abierta" @click="abrirModalMov('salida')">− Retiro</button>
            </div>
          </div>
          <div v-if="movimientosTurno.length === 0" class="empty-msg">Sin movimientos registrados aún.</div>
          <div v-for="m in movimientosTurno" :key="m._id" class="row-line">
            <span class="tag" :class="m.tipo === 'entrada' ? 'tag-green' : 'tag-red'">{{ etiquetaMovimiento(m.tipo) }}</span>
            <span class="row-amount" :class="m.tipo === 'entrada' ? 'text-green' : 'text-red'">
              {{ (m.tipo === 'entrada' ? '+ ' : '− ') + money(m.monto) }}
            </span>
            <span class="row-note">{{ m.descripcion || '—' }}</span>
            <span class="row-time">{{ formatTime(m.createdAt) }}</span>
          </div>
        </section>

        <!-- ÓRDENES -->
        <section v-if="tab === 'ordenes'" class="panel-stack">
          <div class="panel-card">
            <div class="panel-head"><div class="panel-title">Órdenes en curso ({{ ordenesActivas.length }})</div></div>
            <div v-if="ordenesActivas.length === 0" class="empty-msg">No hay órdenes activas.</div>
            <div v-for="o in ordenesActivas" :key="o._id" class="order-row">
              <div class="order-mesa">Mesa {{ o.mesa ? o.mesa.numero : '—' }}</div>
              <span class="tag tag-status">{{ etiquetaEstadoOrden(o) }}</span>
              <div class="order-items">{{ resumenPlatillos(o) }}</div>
              <div class="order-mesero">{{ o.mesero ? o.mesero.nombre : '—' }}</div>
              <div class="order-total">{{ money(o.total) }}</div>
              <button class="btn-mini btn-mini-green" @click="cobrarOrden(o)">Cobrar</button>
              <button class="btn-mini btn-mini-outline-red" @click="cancelarOrden(o)">Cancelar</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-head"><div class="panel-title">Historial de órdenes pagadas del turno</div></div>
            <div v-if="!caja.abierta" class="empty-msg">Abre la caja para ver el historial del turno.</div>
            <div v-else-if="ordenesPagadasTurno.length === 0" class="empty-msg">Aún no hay órdenes cobradas.</div>
            <div v-for="o in ordenesPagadasTurno" :key="o._id" class="row-line">
              <span class="row-mesa-sm">Mesa {{ o.mesa ? o.mesa.numero : '—' }}</span>
              <span class="row-mesero-sm">{{ o.mesero ? o.mesero.nombre : '—' }}</span>
              <span class="row-time">{{ formatTime(o.updatedAt) }}</span>
              <span class="row-total-sm">{{ money(o.total) }}</span>
            </div>
          </div>
        </section>

        <!-- MENÚ -->
        <section v-if="tab === 'menu'" class="panel-card">
          <div class="panel-head">
            <div class="panel-title">Menú del restaurante</div>
            <button class="btn-mini btn-mini-outline" @click="abrirNuevaCategoria">+ Nueva categoría</button>
            <button class="btn-mini btn-mini-green" @click="abrirNuevoPlatillo">+ Nuevo platillo</button>
          </div>
          <div v-for="cat in menuPorCategoria" :key="cat.nombre" class="menu-cat-block">
            <div class="cat-label">{{ cat.nombre }}</div>
            <div v-for="p in cat.items" :key="p._id" class="row-line">
              <span class="row-name">{{ p.nombre }}</span>
              <span class="row-price">{{ money(p.precio) }}</span>
              <button class="btn-mini btn-mini-outline" @click="abrirEditarPlatillo(p)">Editar</button>
              <button class="btn-mini btn-mini-outline-red" @click="pedirEliminar('platillo', p)">Eliminar</button>
            </div>
          </div>
        </section>

        <!-- USUARIOS -->
        <section v-if="tab === 'usuarios'" class="panel-card">
          <div class="panel-head">
            <div class="panel-title">Usuarios del sistema</div>
            <button class="btn-mini btn-mini-green" @click="abrirNuevoUsuario">+ Nuevo usuario</button>
          </div>
          <div v-for="u in usuarios" :key="u._id" class="row-line">
            <span class="row-name">{{ u.nombre }}</span>
            <span class="row-user">@{{ u.usuario }}</span>
            <span class="tag" :class="'tag-rol-' + u.rol">{{ etiquetaRol(u.rol) }}</span>
            <button class="btn-mini btn-mini-outline" @click="abrirEditarUsuario(u)">Editar</button>
            <button class="btn-mini btn-mini-outline-red" @click="pedirEliminar('usuario', u)">Eliminar</button>
          </div>
        </section>

        <!-- MESAS -->
        <section v-if="tab === 'mesas'" class="panel-card">
          <div class="panel-head">
            <div class="panel-title">Mesas del restaurante</div>
            <button class="btn-mini btn-mini-green" @click="abrirNuevaMesa">+ Agregar mesa</button>
          </div>
          <div class="mesas-grid">
            <div v-for="t in mesas" :key="t._id" class="mesa-card">
              <div class="mesa-num">Mesa {{ t.numero }}</div>
              <button
                class="btn-mini btn-mini-outline-red mesa-del"
                :disabled="mesaOcupada(t)"
                :title="mesaOcupada(t) ? 'Mesa con orden activa' : ''"
                @click="pedirEliminar('mesa', t)"
              >Eliminar</button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- ABRIR CAJA -->
    <div v-if="modalAbrirCaja" class="modal-overlay" @click.self="modalAbrirCaja = false">
      <div class="modal-box">
        <div class="modal-title">Abrir caja</div>
        <label class="field-label">Fondo inicial de efectivo</label>
        <input v-model="formAbrirCaja.monto" class="field-input" placeholder="0.00" />
        <div class="modal-actions">
          <button class="btn-outline" @click="modalAbrirCaja = false">Cancelar</button>
          <button class="btn-solid-green" @click="confirmarAbrirCaja">Abrir caja</button>
        </div>
      </div>
    </div>

    <!-- CORTE DE CAJA -->
    <div v-if="modalCierreCaja" class="modal-overlay" @click.self="modalCierreCaja = false">
      <div class="modal-box">
        <div class="modal-title">Corte de caja</div>
        <div class="summary-line"><span>Fondo inicial</span><b>{{ money(caja.base) }}</b></div>
        <div class="summary-line"><span>Ventas del turno</span><b>{{ money(caja.ventas) }}</b></div>
        <div class="summary-line"><span>Ingresos de caja</span><b class="text-green">+{{ money(caja.entradas) }}</b></div>
        <div class="summary-line"><span>Retiros de caja</span><b class="text-red">−{{ money(caja.salidas) }}</b></div>
        <div class="summary-line summary-total"><span>Efectivo esperado</span><b>{{ money(caja.efectivoEnCaja) }}</b></div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalCierreCaja = false">Volver</button>
          <button class="btn-solid-dark" @click="confirmarCierreCaja">Confirmar cierre</button>
        </div>
      </div>
    </div>
    <!-- MOVIMIENTO (INGRESO / RETIRO) -->
    <div v-if="modalMov" class="modal-overlay" @click.self="modalMov = false">
      <div class="modal-box">
        <div class="modal-title">Registrar {{ formMov.tipo === 'entrada' ? 'ingreso' : 'retiro' }}</div>
        <label class="field-label">Monto</label>
        <input v-model="formMov.monto" class="field-input" placeholder="0.00" />
        <label class="field-label">Nota</label>
        <input v-model="formMov.descripcion" class="field-input" placeholder="Ej. compra de hielo" />
        <div v-if="formMov.error" class="field-error">{{ formMov.error }}</div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalMov = false">Cancelar</button>
          <button class="btn-solid-green" @click="confirmarMov">Registrar</button>
        </div>
      </div>
    </div>

    <!-- PLATILLO -->
    <div v-if="modalPlatillo" class="modal-overlay" @click.self="modalPlatillo = false">
      <div class="modal-box">
        <div class="modal-title-serif">{{ formPlatillo._id ? 'Editar platillo' : 'Nuevo platillo' }}</div>
        <label class="field-label">Nombre del platillo</label>
        <input v-model="formPlatillo.nombre" class="field-input" placeholder="Ej. Tacos al pastor" />
        <label class="field-label">Descripción</label>
        <input v-model="formPlatillo.descripcion" class="field-input" placeholder="Ej. Con piña y cilantro" />
        <label class="field-label">Precio</label>
        <input v-model="formPlatillo.precio" class="field-input" placeholder="0.00" />
        <label class="field-label">Categoría</label>
        <input v-model="formPlatillo.categoria" class="field-input" list="lista-categorias" placeholder="Ej. Fuertes" />
        <datalist id="lista-categorias">
          <option v-for="c in categorias" :key="c._id" :value="c.nombre"></option>
        </datalist>
        <div v-if="formPlatillo.error" class="field-error">{{ formPlatillo.error }}</div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalPlatillo = false">Cancelar</button>
          <button class="btn-solid-green" @click="guardarPlatillo">Guardar</button>
        </div>
      </div>
    </div>

    <!-- USUARIO -->
    <div v-if="modalUsuario" class="modal-overlay" @click.self="modalUsuario = false">
      <div class="modal-box">
        <div class="modal-title-serif">{{ formUsuario._id ? 'Editar usuario' : 'Nuevo usuario' }}</div>
        <label class="field-label">Nombre completo</label>
        <input v-model="formUsuario.nombre" class="field-input" placeholder="Ej. Ana Gómez" />
        <label class="field-label">Usuario</label>
        <input v-model="formUsuario.usuario" class="field-input" placeholder="Ej. ana" :disabled="!!formUsuario._id" />
        <label class="field-label">Contraseña</label>
        <input v-model="formUsuario.password" type="password" class="field-input"
               :placeholder="formUsuario._id ? 'Dejar en blanco para no cambiarla' : '••••'" />
        <label class="field-label">Rol</label>
        <select v-model="formUsuario.rol" class="field-input">
          <option value="mesero">Mesero</option>
          <option value="cocinero">Cocinero</option>
          <option value="cajero">Administrador</option>
        </select>
        <div v-if="formUsuario.error" class="field-error">{{ formUsuario.error }}</div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalUsuario = false">Cancelar</button>
          <button class="btn-solid-green" @click="guardarUsuario">Guardar</button>
        </div>
      </div>
    </div>

    <!-- MESA -->
    <div v-if="modalMesa" class="modal-overlay" @click.self="modalMesa = false">
      <div class="modal-box">
        <div class="modal-title-serif">Agregar mesa</div>
        <label class="field-label">Número de mesa</label>
        <input v-model="formMesa.numero" class="field-input" placeholder="Ej. 15" />
        <label class="field-label">Capacidad (personas)</label>
        <input v-model="formMesa.capacidad" class="field-input" placeholder="Ej. 4" />
        <div v-if="formMesa.error" class="field-error">{{ formMesa.error }}</div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalMesa = false">Cancelar</button>
          <button class="btn-solid-green" @click="guardarMesa">Agregar</button>
        </div>
      </div>
    </div>
    <!-- CATEGORÍA -->
    <div v-if="modalCategoria" class="modal-overlay" @click.self="modalCategoria = false">
      <div class="modal-box">
        <div class="modal-title-serif">Nueva categoría</div>
        <label class="field-label">Nombre de la categoría</label>
        <input v-model="formCategoria.nombre" class="field-input" placeholder="Ej. Bebidas" />
        <label class="field-label">Descripción</label>
        <input v-model="formCategoria.descripcion" class="field-input" placeholder="Ej. Refrescos, aguas y cervezas" />
        <div v-if="formCategoria.error" class="field-error">{{ formCategoria.error }}</div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalCategoria = false">Cancelar</button>
          <button class="btn-solid-green" @click="guardarCategoria">Agregar</button>
        </div>
      </div>
    </div>

    <!-- CONFIRMAR ELIMINAR -->
    <div v-if="modalEliminar" class="modal-overlay" @click.self="modalEliminar = null">
      <div class="modal-box modal-center">
        <div class="modal-icon">⚠️</div>
        <div class="modal-title-serif">¿Eliminar {{ modalEliminar.label }}?</div>
        <div class="modal-sub">Esta acción no se puede deshacer.</div>
        <div class="modal-actions">
          <button class="btn-outline" @click="modalEliminar = null">Volver</button>
          <button class="btn-solid-red" @click="confirmarEliminar">Sí, eliminar</button>
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
  name: 'AdminPanel',
  data() {
    return {
      API_URL,
      currentUser: null,
      tab: 'caja',

      caja: { abierta: false, base: 0, ventas: 0, entradas: 0, salidas: 0, efectivoEnCaja: 0, desde: null },
      movimientos: [],
      ordenes: [],
      menu: [],
      categorias: [],
      usuarios: [],
      mesas: [],

      modalAbrirCaja: false,
      formAbrirCaja: { monto: '' },

      modalCierreCaja: false,

      modalMov: false,
      formMov: { tipo: 'entrada', monto: '', descripcion: '', error: '' },

      modalPlatillo: false,
      formPlatillo: { _id: null, nombre: '', descripcion: '', precio: '', categoria: '', error: '' },

      modalUsuario: false,
      formUsuario: { _id: null, nombre: '', usuario: '', password: '', rol: 'mesero', error: '' },

      modalMesa: false,
      formMesa: { numero: '', capacidad: '', error: '' },

      modalCategoria: false,
      formCategoria: { nombre: '', descripcion: '', error: '' },

      modalEliminar: null, // { kind, id, label }

      toast: null,
      cargando: false,
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
    movimientosTurno() {
      if (!this.caja.abierta || !this.caja.desde) return []
      const desde = new Date(this.caja.desde).getTime()
      return this.movimientos
        .filter(m => (m.tipo === 'entrada' || m.tipo === 'salida') && new Date(m.createdAt).getTime() >= desde)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
  },

  created() {
    const raw = localStorage.getItem('usuario')
    this.currentUser = raw ? JSON.parse(raw) : null
    this.cargarCaja()
    this.cargarOrdenes()
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

    // ---------- navegación de tabs (carga perezosa) ----------
    setTab(t) {
      this.tab = t
      if (t === 'menu' && this.menu.length === 0) { this.cargarMenu(); this.cargarCategorias() }
      if (t === 'usuarios' && this.usuarios.length === 0) this.cargarUsuarios()
      if (t === 'mesas' && this.mesas.length === 0) this.cargarMesas()
      if (t === 'ordenes') this.cargarOrdenes()
    },

    // ---------- CAJA ----------
    async cargarCaja() {
      try {
        const data = await this.peticion('/caja/estado')
        this.caja = { abierta: false, base: 0, ventas: 0, entradas: 0, salidas: 0, efectivoEnCaja: 0, desde: null, ...data }
        if (this.caja.abierta) this.cargarMovimientos()
      } catch (e) { this.showToast(e.message) }
    },
    async cargarMovimientos() {
      try { this.movimientos = await this.peticion('/movimientos-caja') }
      catch (e) { this.showToast(e.message) }
    },
    async confirmarAbrirCaja() {
      const monto = Number(this.formAbrirCaja.monto)
      if (isNaN(monto) || monto < 0) { this.showToast('Ingresa un fondo inicial válido.'); return }
      try {
        await this.peticion('/movimientos-caja', {
          method: 'POST',
          body: JSON.stringify({ tipo: 'apertura', monto, cajero: this.currentUser?.id, descripcion: 'Apertura de caja' }),
        })
        this.modalAbrirCaja = false
        this.formAbrirCaja.monto = ''
        this.showToast('Caja abierta.')
        await this.cargarCaja()
      } catch (e) { this.showToast(e.message) }
    },
    pedirCierreCaja() {
      if (this.ordenesActivas.length > 0) { this.showToast('No puedes cerrar caja: hay órdenes activas sin cobrar.'); return }
      this.modalCierreCaja = true
    },
    async confirmarCierreCaja() {
      try {
        await this.peticion('/movimientos-caja', {
          method: 'POST',
          body: JSON.stringify({ tipo: 'cierre', monto: 0, cajero: this.currentUser?.id, descripcion: 'Cierre de caja' }),
        })
        this.modalCierreCaja = false
        this.showToast('Caja cerrada. Corte generado.')
        await this.cargarCaja()
      } catch (e) { this.showToast(e.message) }
    },
    abrirModalMov(tipo) {
      this.formMov = { tipo, monto: '', descripcion: '', error: '' }
      this.modalMov = true
    },
    async confirmarMov() {
      const monto = Number(this.formMov.monto)
      if (isNaN(monto) || monto <= 0) { this.formMov.error = 'Ingresa un monto válido.'; return }
      if (this.formMov.tipo === 'salida' && monto > this.caja.efectivoEnCaja) {
        this.formMov.error = 'El retiro excede el efectivo disponible.'; return
      }
      try {
        await this.peticion('/movimientos-caja', {
          method: 'POST',
          body: JSON.stringify({
            tipo: this.formMov.tipo, monto, cajero: this.currentUser?.id, descripcion: this.formMov.descripcion,
          }),
        })
        this.modalMov = false
        this.showToast(this.formMov.tipo === 'entrada' ? 'Ingreso registrado.' : 'Retiro registrado.')
        await this.cargarCaja()
      } catch (e) { this.formMov.error = e.message }
    },
    etiquetaMovimiento(tipo) { return tipo === 'entrada' ? 'Ingreso' : 'Retiro' },

    // ---------- ÓRDENES ----------
    async cargarOrdenes() {
      try { this.ordenes = await this.peticion('/ordenes') }
      catch (e) { this.showToast(e.message) }
    },
    resumenPlatillos(o) {
      const conteo = {}
      o.platillos.forEach(p => { conteo[p.nombre] = (conteo[p.nombre] || 0) + 1 })
      return Object.entries(conteo).map(([nombre, qty]) => `${qty}x ${nombre}`).join(', ')
    },
    etiquetaEstadoOrden(o) {
      const estados = o.platillos.map(p => p.estado)
      if (estados.every(e => e === 'ventanilla')) return 'En ventanilla'
      if (estados.some(e => e === 'cocinado' || e === 'ventanilla')) return 'Cocinado'
      return 'En proceso'
    },
    async cobrarOrden(o) {
      try {
        await this.peticion(`/ordenes/${o._id}/pagar`, {
          method: 'PUT',
          body: JSON.stringify({ cajero: this.currentUser?.id }),
        })
        this.showToast('Cobro registrado.')
        await Promise.all([this.cargarOrdenes(), this.cargarCaja()])
      } catch (e) { this.showToast(e.message) }
    },
    async cancelarOrden(o) {
      if (!confirm(`¿Cancelar la orden de la mesa ${o.mesa ? o.mesa.numero : ''}? Esta acción no se puede deshacer.`)) return
      try {
        await this.peticion(`/ordenes/${o._id}`, { method: 'DELETE' })
        this.showToast('Orden cancelada.')
        await this.cargarOrdenes()
      } catch (e) { this.showToast(e.message) }
    },

    // ---------- MENÚ ----------
    async cargarMenu() {
      try { this.menu = await this.peticion('/menu') }
      catch (e) { this.showToast(e.message) }
    },
    async cargarCategorias() {
      try { this.categorias = await this.peticion('/categorias') }
      catch (e) { this.showToast(e.message) }
    },
    abrirNuevoPlatillo() {
      this.formPlatillo = { _id: null, nombre: '', descripcion: '', precio: '', categoria: '', error: '' }
      this.modalPlatillo = true
    },
    abrirEditarPlatillo(p) {
      this.formPlatillo = {
        _id: p._id, nombre: p.nombre, descripcion: p.descripcion || '',
        precio: String(p.precio), categoria: p.categoria ? p.categoria.nombre : '', error: '',
      }
      this.modalPlatillo = true
    },
      async obtenerOCrearCategoria(nombre) {
      const existente = this.categorias.find(c => c.nombre.toLowerCase() === nombre.toLowerCase())
      if (existente) return existente._id
      const creada = await this.peticion('/categorias', {
        method: 'POST',
        body: JSON.stringify({ nombre, descripcion: nombre }),
      })
      if (!creada?.categoria?._id) {
        throw new Error('El servidor no regresó la categoría creada.')
      }
      this.categorias.push(creada.categoria)
      return creada.categoria._id
      },
      abrirNuevaCategoria() {
      this.formCategoria = { nombre: '', descripcion: '', error: '' }
      this.modalCategoria = true
      },
      async guardarCategoria() {
      const nombre = this.formCategoria.nombre.trim()
      const descripcion = this.formCategoria.descripcion.trim()
      if (!nombre || !descripcion) {
        this.formCategoria.error = 'Completa nombre y descripción.'
        return
      }
    if (this.categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      this.formCategoria.error = 'Ya existe una categoría con ese nombre.'
      return
    }
    try {
      const creada = await this.peticion('/categorias', {
        method: 'POST',
        body: JSON.stringify({ nombre, descripcion }),
      })
      if (!creada?.categoria?._id) {
        this.formCategoria.error = 'El servidor no regresó la categoría creada.'
        return
      }
      this.categorias.push(creada.categoria)
      this.modalCategoria = false
      this.showToast('Categoría agregada.')
    } catch (e) {
      this.formCategoria.error = e.message
    }
},
    async guardarPlatillo() {
      const nombre = this.formPlatillo.nombre.trim()
      const descripcion = this.formPlatillo.descripcion.trim()
      const precio = Number(this.formPlatillo.precio)
      const categoriaNombre = this.formPlatillo.categoria.trim()
      if (!nombre || !descripcion || !categoriaNombre || isNaN(precio) || precio <= 0) {
        this.formPlatillo.error = 'Completa nombre, descripción, categoría y un precio válido.'
        return
      }
      try {
        const categoriaId = await this.obtenerOCrearCategoria(categoriaNombre)
        const payload = { nombre, descripcion, precio, categoria: categoriaId }
        if (this.formPlatillo._id) {
          await this.peticion(`/menu/${this.formPlatillo._id}`, { method: 'PUT', body: JSON.stringify(payload) })
          this.showToast('Platillo actualizado.')
        } else {
          await this.peticion('/menu', { method: 'POST', body: JSON.stringify(payload) })
          this.showToast('Platillo agregado.')
        }
        this.modalPlatillo = false
        await this.cargarMenu()
      } catch (e) { this.formPlatillo.error = e.message }
    },
   

    // ---------- USUARIOS ----------
    async cargarUsuarios() {
      try { this.usuarios = await this.peticion('/usuarios') }
      catch (e) { this.showToast(e.message) }
    },
    etiquetaRol(rol) {
      return { mesero: 'Mesero', cocinero: 'Cocinero', cajero: 'Administrador' }[rol] || rol
    },
    abrirNuevoUsuario() {
      this.formUsuario = { _id: null, nombre: '', usuario: '', password: '', rol: 'mesero', error: '' }
      this.modalUsuario = true
    },
    abrirEditarUsuario(u) {
      this.formUsuario = { _id: u._id, nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol, error: '' }
      this.modalUsuario = true
    },
    async guardarUsuario() {
      const nombre = this.formUsuario.nombre.trim()
      const usuario = this.formUsuario.usuario.trim().toLowerCase()
      if (!nombre || !usuario) { this.formUsuario.error = 'Completa nombre y usuario.'; return }
      if (!this.formUsuario._id && !this.formUsuario.password) {
        this.formUsuario.error = 'La contraseña es obligatoria para un usuario nuevo.'; return
      }
      try {
        if (this.formUsuario._id) {
          const payload = { nombre, rol: this.formUsuario.rol, activo: true }
          if (this.formUsuario.password) payload.password = this.formUsuario.password
          await this.peticion(`/usuarios/${this.formUsuario._id}`, { method: 'PUT', body: JSON.stringify(payload) })
          this.showToast('Usuario actualizado.')
        } else {
          await this.peticion('/usuarios', {
            method: 'POST',
            body: JSON.stringify({ usuario, password: this.formUsuario.password, nombre, rol: this.formUsuario.rol }),
          })
          this.showToast('Usuario agregado.')
        }
        this.modalUsuario = false
        await this.cargarUsuarios()
      } catch (e) { this.formUsuario.error = e.message }
    },

    // ---------- MESAS ----------
    async cargarMesas() {
      try { this.mesas = await this.peticion('/mesas') }
      catch (e) { this.showToast(e.message) }
    },
    mesaOcupada(t) {
      return this.ordenesActivas.some(o => o.mesa && o.mesa._id === t._id)
    },
    abrirNuevaMesa() {
      this.formMesa = { numero: '', capacidad: '', error: '' }
      this.modalMesa = true
    },
    async guardarMesa() {
      const numero = Number(this.formMesa.numero)
      const capacidad = Number(this.formMesa.capacidad)
      if (!numero || numero <= 0) { this.formMesa.error = 'Ingresa un número de mesa válido.'; return }
      if (!capacidad || capacidad <= 0) { this.formMesa.error = 'Ingresa una capacidad válida.'; return }
      if (this.mesas.some(t => t.numero === numero)) { this.formMesa.error = 'Ya existe una mesa con ese número.'; return }
      try {
        await this.peticion('/mesas', { method: 'POST', body: JSON.stringify({ numero, capacidad }) })
        this.modalMesa = false
        this.showToast('Mesa agregada.')
        await this.cargarMesas()
      } catch (e) { this.formMesa.error = e.message }
    },

    // ---------- ELIMINAR (genérico) ----------
    pedirEliminar(kind, item) {
      const labels = { platillo: item.nombre, usuario: item.nombre, mesa: 'Mesa ' + item.numero }
      const paths = { platillo: `/menu/${item._id}`, usuario: `/usuarios/${item._id}`, mesa: `/mesas/${item._id}` }
      this.modalEliminar = { kind, label: labels[kind], path: paths[kind] }
    },
    async confirmarEliminar() {
      if (!this.modalEliminar) return
      try {
        await this.peticion(this.modalEliminar.path, { method: 'DELETE' })
        this.showToast('Eliminado correctamente.')
        if (this.modalEliminar.kind === 'platillo') await this.cargarMenu()
        if (this.modalEliminar.kind === 'usuario') await this.cargarUsuarios()
        if (this.modalEliminar.kind === 'mesa') await this.cargarMesas()
      } catch (e) { this.showToast(e.message) }
      finally { this.modalEliminar = null }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');

.admin-panel {
  min-height: 100vh;
  background: #f5f2ee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1f2937;
}

/* ---------- header ---------- */
.admin-header { background: #2f4d3a; color: #fff; }
.header-top { padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.brand { display: flex; align-items: center; gap: 14px; }
.brand-icon { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 16px; }
.brand-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; font-style: italic; line-height: 1.1; }
.brand-sub { font-size: 12px; color: #aecbb0; letter-spacing: 0.03em; }
.user-pill { font-size: 13px; background: rgba(255,255,255,0.14); padding: 4px 10px; border-radius: 999px; color: #dcead9; margin-left: 8px; }
.header-actions { display: flex; gap: 10px; }

.header-caja { padding: 20px 28px 24px; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.label-upper { font-size: 12px; color: #a9c2a8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.caja-status { display: flex; align-items: center; gap: 8px; }
.dot { width: 9px; height: 9px; border-radius: 999px; }
.dot-on { background: #22c55e; }
.dot-off { background: #94a3b8; }
.caja-status-text { font-size: 19px; font-weight: 700; }
.caja-since { font-size: 12.5px; color: #a9c2a8; margin-top: 2px; }
.caja-amount { font-size: 26px; font-weight: 700; color: #e8c88a; }
.caja-cta { margin-left: auto; display: flex; gap: 10px; }
.caja-warning { background: #5c342a; color: #f0d9cf; font-size: 13px; padding: 8px 28px; }

/* ---------- body / sidebar ---------- */
.admin-body { display: flex; align-items: flex-start; }
.admin-sidebar {
  width: 210px; flex-shrink: 0; background: #1f3327; min-height: calc(100vh - 137px);
  padding: 20px 12px; display: flex; flex-direction: column; gap: 2px;
}
.sidebar-label { font-size: 10.5px; font-weight: 700; color: #7fa080; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px 8px; }
.sidebar-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 14px 10px; }
.nav-btn {
  display: flex; align-items: center; gap: 10px; text-align: left; padding: 10px 12px;
  border-radius: 9px; border: none; background: transparent; color: #b7cdb6;
  font-weight: 600; font-size: 14px; cursor: pointer;
}
.nav-btn:hover { background: #33513e; }
.nav-btn.active { background: #3a5a44; color: #fff; }

.admin-main { flex: 1; padding: 24px 28px; display: flex; flex-direction: column; gap: 22px; max-width: 1100px; }
.panel-stack { display: flex; flex-direction: column; gap: 22px; }

/* ---------- cards ---------- */
.panel-card { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(74,51,43,0.06); border: 1px solid #ece5dd; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f2ede6; flex-wrap: wrap; gap: 10px; }
.panel-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 19px; font-style: italic; color: #2f4d3a; }
.panel-head-actions { display: flex; gap: 8px; }
.empty-msg { padding: 20px 0; text-align: center; color: #9ca3af; font-size: 14px; }

.row-line { display: flex; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
.row-name { flex: 1; font-size: 14px; color: #1f2937; min-width: 140px; }
.row-price { font-size: 13.5px; font-weight: 600; color: #4a332b; width: 80px; }
.row-user { font-size: 13px; color: #64748b; width: 110px; }
.row-note { font-size: 13px; color: #64748b; flex: 1; min-width: 120px; }
.row-time { font-size: 12px; color: #94a3b8; }
.row-amount { font-weight: 700; font-size: 14px; min-width: 90px; }
.row-mesa-sm { font-weight: 700; font-size: 13.5px; color: #4a332b; min-width: 70px; }
.row-mesero-sm { font-size: 13px; color: #64748b; min-width: 110px; }
.row-total-sm { font-weight: 700; font-size: 14px; color: #15803d; margin-left: auto; }

.tag { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.tag-green { background: #dfe8d8; color: #3f6b3a; }
.tag-red { background: #f5ddd6; color: #a34a3a; }
.tag-status { background: #dbe3ee; color: #3d5a80; }
.tag-rol-mesero { background: #f2e2d8; color: #a05f45; }
.tag-rol-cocinero { background: #dfe8d8; color: #4d6b45; }
.tag-rol-cajero { background: #e6ddf0; color: #6b4f8f; }
.text-green { color: #15803d; }
.text-red { color: #dc2626; }

.menu-cat-block { margin-bottom: 14px; }
.cat-label { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }

.order-row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: #f8fafc; border-radius: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.order-mesa { font-weight: 700; font-size: 14.5px; color: #4a332b; min-width: 70px; }
.order-items { font-size: 13px; color: #64748b; flex: 1; min-width: 180px; }
.order-mesero { font-size: 11.5px; color: #94a3b8; }
.order-total { font-weight: 700; font-size: 14.5px; color: #4a332b; }

.mesas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; }
.mesa-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
.mesa-num { font-size: 15px; font-weight: 700; color: #4a332b; margin-bottom: 8px; }
.mesa-del { width: 100%; }

/* ---------- botones ---------- */
.btn-ghost { font-size: 12px; padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: #fff; cursor: pointer; }
.btn-ghost:hover { background: rgba(255,255,255,0.1); }
.btn-danger { padding: 11px 18px; border-radius: 10px; border: none; background: #dc2626; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
.btn-danger:disabled { background: #64748b; cursor: not-allowed; }
.btn-gold { padding: 11px 18px; border-radius: 10px; border: none; background: #e8c88a; color: #2f4d3a; font-weight: 700; font-size: 14px; cursor: pointer; }
.btn-gold:hover { background: #f0d9a8; }

.btn-mini { padding: 8px 13px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px; cursor: pointer; }
.btn-mini:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-mini-green { background: #6b8f5a; color: #fff; }
.btn-mini-green:hover:not(:disabled) { background: #7ba268; }
.btn-mini-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.btn-mini-outline { background: #fff; color: #4a332b; border: 1px solid #e6ddd4; }
.btn-mini-outline:hover { background: #f5f0ea; }
.btn-mini-outline-red { background: #fff; color: #a34a3a; border: 1px solid #edc9bd; }
.btn-mini-outline-red:hover:not(:disabled) { background: #faeee9; }

/* ---------- modales ---------- */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-box { background: #fff; border-radius: 16px; width: 100%; max-width: 400px; padding: 26px; }
.modal-center { text-align: center; }
.modal-icon { font-size: 28px; margin-bottom: 6px; }
.modal-title { font-size: 19px; font-weight: 700; color: #4a332b; margin-bottom: 16px; }
.modal-title-serif { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; font-style: italic; color: #4a332b; margin-bottom: 16px; }
.modal-sub { font-size: 13.5px; color: #64748b; margin-bottom: 20px; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.field-input { width: 100%; box-sizing: border-box; padding: 11px 12px; border-radius: 9px; border: 1px solid #d1d5db; font-size: 15px; margin-bottom: 14px; }
.field-error { font-size: 13px; color: #b91c1c; background: #fee2e2; padding: 8px 10px; border-radius: 8px; margin-bottom: 14px; }
.modal-actions { display: flex; gap: 10px; margin-top: 4px; }
.btn-outline { flex: 1; padding: 11px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 600; font-size: 14px; cursor: pointer; }
.btn-solid-green { flex: 1; padding: 11px; border-radius: 9px; border: none; background: #6b8f5a; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
.btn-solid-green:hover { background: #7ba268; }
.btn-solid-dark { flex: 1; padding: 11px; border-radius: 9px; border: none; background: #0b2540; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
.btn-solid-red { flex: 1; padding: 11px; border-radius: 9px; border: none; background: #dc2626; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }

.summary-line { display: flex; justify-content: space-between; font-size: 14px; color: #374151; padding: 4px 0; }
.summary-total { padding-top: 10px; margin-top: 6px; border-top: 1px solid #e2e8f0; font-size: 16.5px; font-weight: 700; }

.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #111827; color: #fff; padding: 12px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 200;
}
</style>
