<template>
  <div class="cocina-panel">
    <!-- ENCABEZADO -->
    <header class="cocina-header">
      <div class="header-top">
        <div class="brand">
          <div class="brand-title">Sucursal Central</div>
          <div class="user-pill">
            Cocina · {{ currentUser ? currentUser.nombre : "" }}
          </div>
        </div>
        <button class="btn-ghost" @click="salir">Salir</button>
      </div>
    </header>

    <div class="content">
      <div class="columns">
        <!-- PENDIENTE -->
        <div class="column">
          <div class="column-head">
            <span class="column-dot dot-amber"></span>
            <span class="column-title">Pendiente</span>
            <span class="column-count">{{ pendiente.length }}</span>
          </div>
          <div v-if="pendiente.length === 0" class="empty-msg">
            Sin platillos pendientes.
          </div>
          <div v-for="g in pendiente" :key="g.key" class="dish-card">
            <div class="dish-card-head">
              <div class="dish-mesa">Mesa {{ g.mesaNumero }}</div>
              <div class="dish-time">{{ formatTime(g.time) }}</div>
            </div>
            <div class="dish-nombre">{{ g.qty }}× {{ g.nombre }}</div>
            <div v-if="g.nota" class="dish-nota">Nota: {{ g.nota }}</div>
            <button
              class="btn-avanzar btn-avanzar-amber"
              @click="avanzarGrupo(g)"
            >
              Iniciar preparación →
            </button>
          </div>
        </div>

        <!-- EN PROCESO -->
        <div class="column">
          <div class="column-head">
            <span class="column-dot dot-blue"></span>
            <span class="column-title">En proceso</span>
            <span class="column-count">{{ enProceso.length }}</span>
          </div>
          <div v-if="enProceso.length === 0" class="empty-msg">
            Nada cocinándose ahora.
          </div>
          <div v-for="g in enProceso" :key="g.key" class="dish-card">
            <div class="dish-card-head">
              <div class="dish-mesa">Mesa {{ g.mesaNumero }}</div>
              <div class="dish-time">{{ formatTime(g.time) }}</div>
            </div>
            <div class="dish-nombre">{{ g.qty }}× {{ g.nombre }}</div>
            <div v-if="g.nota" class="dish-nota">Nota: {{ g.nota }}</div>
            <button
              class="btn-avanzar btn-avanzar-blue"
              @click="avanzarGrupo(g)"
            >
              Enviar a ventanilla →
            </button>
          </div>
        </div>

        <!-- EN VENTANILLA -->
        <div class="column">
          <div class="column-head">
            <span class="column-dot dot-purple"></span>
            <span class="column-title">En ventanilla</span>
            <span class="column-count">{{ enVentanilla.length }}</span>
          </div>
          <div v-if="enVentanilla.length === 0" class="empty-msg">
            Nada esperando a que lo recojan.
          </div>
          <div
            v-for="g in enVentanilla"
            :key="g.key"
            class="dish-card dish-card-ready"
          >
            <div class="dish-card-head">
              <div class="dish-mesa">Mesa {{ g.mesaNumero }}</div>
              <div class="dish-time">{{ formatTime(g.time) }}</div>
            </div>
            <div class="dish-nombre">{{ g.qty }}× {{ g.nombre }}</div>
            <div class="dish-esperando">
              Esperando a que el mesero lo recoja
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default {
  name: "Cocina",
  data() {
    return {
      API_URL,
      currentUser: null,
      ordenes: [],
      toast: null,
      _pollTimer: null,
    };
  },

  computed: {
    ordenesActivas() {
      return this.ordenes.filter((o) => !o.pagada);
    },
    // Aplana todas las órdenes activas en "grupos" por orden+nombre+estado
    // (unidades individuales agrupadas para verse como "3x Tacos"), dejando
    // fuera lo que el mesero ya entregó.
    gruposFlat() {
      const grupos = {};
      this.ordenesActivas.forEach((o) => {
        o.platillos.forEach((p) => {
          if (p.entregado) return;
          const key = `${o._id}|${p.nombre}|${p.estado}`;
          if (!grupos[key]) {
            grupos[key] = {
              key,
              orderId: o._id,
              platilloId: p._id,
              ids: [],
              mesaNumero: o.mesa ? o.mesa.numero : "—",
              nombre: p.nombre,
              estado: p.estado,
              nota: o.nota,
              qty: 0,
              time: this.timestampDe(p._id),
            };
          }
          grupos[key].qty += 1;
          grupos[key].ids.push(p._id);
          // Se queda con el timestamp más viejo del grupo, para ordenar por
          // lo que lleva más tiempo esperando.
          const t = this.timestampDe(p._id);
          if (t < grupos[key].time) grupos[key].time = t;
        });
      });
      return Object.values(grupos);
    },
    pendiente() {
      return this.gruposFlat
        .filter((g) => g.estado === "proceso")
        .sort((a, b) => a.time - b.time);
    },
    enProceso() {
      return this.gruposFlat
        .filter((g) => g.estado === "cocinado")
        .sort((a, b) => a.time - b.time);
    },
    enVentanilla() {
      return this.gruposFlat
        .filter((g) => g.estado === "ventanilla")
        .sort((a, b) => a.time - b.time);
    },
  },

  created() {
    const raw = localStorage.getItem("usuario");
    this.currentUser = raw ? JSON.parse(raw) : null;
    this.cargarOrdenes();
    // Polling simple, igual que en Mesero.vue: refresca cada pocos segundos
    // para ver órdenes nuevas o cambios hechos desde otras vistas.
    this._pollTimer = setInterval(() => this.cargarOrdenes(), 5000);
  },

  beforeUnmount() {
    clearInterval(this._pollTimer);
  },

  methods: {
    // ---------- utilidades ----------
    formatTime(ts) {
      return ts
        ? new Date(ts).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
    },
    // Los platillos embebidos no tienen su propio createdAt; el ObjectId de
    // Mongo trae el timestamp de creación codificado en sus primeros 4 bytes,
    // así que se usa eso para saber desde cuándo espera cada platillo.
    timestampDe(objectId) {
      return parseInt(String(objectId).substring(0, 8), 16) * 1000;
    },
    showToast(msg) {
      this.toast = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        this.toast = null;
      }, 2500);
    },
    async peticion(path, options = {}) {
      const res = await fetch(`${this.API_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.mensaje || "Ocurrió un error con el servidor");
      return data;
    },
    salir() {
      localStorage.removeItem("usuario");
      this.$router.push("/");
    },

    // ---------- datos ----------
    async cargarOrdenes() {
      try {
        this.ordenes = await this.peticion("/ordenes");
      } catch (e) {
        this.showToast(e.message);
      }
    },

    // ---------- avanzar estado ----------
    async avanzarGrupo(g) {
      try {
        await Promise.all(
          g.ids.map((id) =>
            this.peticion(`/ordenes/${g.orderId}/platillos/${id}/avanzar`, {
              method: "PUT",
            }),
          ),
        );
        await this.cargarOrdenes();
      } catch (e) {
        this.showToast(e.message);
      }
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

.cocina-panel {
  min-height: 100vh;
  background: #f5f2ee;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #1f2937;
}

/* ---------- header ---------- */
.cocina-header {
  background: #2f4d3a;
  color: #fff;
}
.header-top {
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand-title {
  font-family: "Instrument Serif", Georgia, serif;
  font-size: 22px;
  font-style: italic;
  line-height: 1.1;
}
.user-pill {
  font-size: 13px;
  background: rgba(255, 255, 255, 0.14);
  padding: 4px 10px;
  border-radius: 999px;
  color: #dcead9;
}
.btn-ghost {
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: #fff;
  cursor: pointer;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ---------- columnas ---------- */
.content {
  padding: 24px 28px 40px;
}
.columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  align-items: start;
}
@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
}

.column-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 2px;
}
.column-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}
.dot-amber {
  background: #d99a1f;
}
.dot-blue {
  background: #3d5a80;
}
.dot-purple {
  background: #6b4f8f;
}
.column-title {
  font-family: "Instrument Serif", Georgia, serif;
  font-size: 18px;
  font-style: italic;
  color: #2f4d3a;
}
.column-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  background: #fff;
  border: 1px solid #ece5dd;
  padding: 2px 9px;
  border-radius: 999px;
}

.empty-msg {
  padding: 24px 14px;
  text-align: center;
  color: #9ca3af;
  font-size: 13.5px;
  background: #fff;
  border-radius: 12px;
  border: 1px dashed #e2ddd4;
}

.dish-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #ece5dd;
  box-shadow: 0 1px 3px rgba(47, 77, 58, 0.05);
  margin-bottom: 12px;
}
.dish-card-ready {
  border-color: #dcd0ec;
  background: #faf8fd;
}
.dish-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.dish-mesa {
  font-size: 12.5px;
  font-weight: 700;
  color: #4a332b;
}
.dish-time {
  font-size: 11.5px;
  color: #9ca3af;
}
.dish-nombre {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}
.dish-nota {
  font-size: 12px;
  color: #8a6a1f;
  background: #faf0da;
  padding: 5px 8px;
  border-radius: 7px;
  margin-bottom: 8px;
}
.dish-esperando {
  font-size: 12px;
  color: #6b4f8f;
  margin-top: 6px;
}

.btn-avanzar {
  width: 100%;
  margin-top: 8px;
  padding: 9px;
  border-radius: 9px;
  border: none;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
}
.btn-avanzar-amber {
  background: #d99a1f;
}
.btn-avanzar-amber:hover {
  background: #e3a92f;
}
.btn-avanzar-blue {
  background: #3d5a80;
}
.btn-avanzar-blue:hover {
  background: #4a6a94;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 200;
}
</style>
