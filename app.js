/* =========================================================
   Panel de servicio — lógica Vue 3 (build CDN, sin bundler)
   Datos de ejemplo listos para conectarse a tu backend.
   Estados de platillo: 'proceso' -> 'cocinado' -> 'ventanilla'
   ========================================================= */

const { createApp } = Vue;

createApp({
  data() {
    return {
      // Rol activo (para previsualizar cada vista). 'admin' ve todo.
      rol: 'admin',
      roles: [
        { id: 'admin',    nombre: 'Admin' },
        { id: 'mesero',   nombre: 'Mesero' },
        { id: 'cocinero', nombre: 'Cocinero' },
        { id: 'cajero',   nombre: 'Cajero' },
      ],

      // Mesero "conectado", para filtrar la vista de mesero.
      meseroActual: 'Diana',

      // Estado de la caja / turno.
      caja: {
        abierta: true,
        cajero: 'Rubén',
        base: 800,
        entradas: 150,
        salidas: 60,
      },

      // Órdenes del turno. Cada platillo tiene su propio estado.
      // Una orden 'pagada:true' ya fue cobrada por el cajero.
      ordenes: [
        {
          id: 104, mesa: 3, mesero: 'Diana', total: 415, pagada: false,
          platillos: [
            { nombre: 'Tacos al pastor', estado: 'ventanilla' },
            { nombre: 'Agua de horchata', estado: 'cocinado' },
            { nombre: 'Quesadilla',       estado: 'proceso' },
          ],
        },
        {
          id: 105, mesa: 7, mesero: 'Luis', total: 260, pagada: false,
          platillos: [
            { nombre: 'Enchiladas verdes', estado: 'proceso' },
            { nombre: 'Café de olla',       estado: 'proceso' },
          ],
        },
        {
          id: 106, mesa: 1, mesero: 'Diana', total: 190, pagada: false,
          platillos: [
            { nombre: 'Pozole rojo', estado: 'cocinado' },
          ],
        },
        {
          id: 103, mesa: 5, mesero: 'Luis', total: 330, pagada: true,
          platillos: [
            { nombre: 'Milanesa', estado: 'ventanilla' },
            { nombre: 'Refresco', estado: 'ventanilla' },
          ],
        },
      ],

      // Cola de notificaciones "en ventanilla".
      toasts: [],
      _toastId: 0,
    };
  },

  computed: {
    // Órdenes que aún no se cobran.
    ordenesActivas() {
      return this.ordenes.filter(o => !o.pagada);
    },
    ordenesPagadas() {
      return this.ordenes.filter(o => o.pagada);
    },

    // Órdenes visibles según el rol.
    ordenesVisibles() {
      if (this.rol === 'mesero') {
        // El mesero ve todas, pero aquí ordenamos las suyas primero.
        return [...this.ordenes].sort((a, b) =>
          (a.mesero === this.meseroActual ? -1 : 1) -
          (b.mesero === this.meseroActual ? -1 : 1)
        );
      }
      if (this.rol === 'cajero') return this.ordenes;      // cobra y ve completadas
      if (this.rol === 'cocinero') return this.ordenesActivas;
      return this.ordenes;                                  // admin: todo
    },

    // Platillos que la cocina todavía debe mover.
    platillosCocina() {
      const lista = [];
      for (const o of this.ordenesActivas) {
        o.platillos.forEach((p, i) => {
          if (p.estado !== 'ventanilla') {
            lista.push({
              key: `${o.id}-${i}`,
              ref: p,
              nombre: p.nombre,
              estado: p.estado,
              mesa: o.mesa,
              mesero: o.mesero,
            });
          }
        });
      }
      // Primero los que están cocinados (a un paso de salir).
      const orden = { cocinado: 0, proceso: 1 };
      return lista.sort((a, b) => orden[a.estado] - orden[b.estado]);
    },

    platillosPendientes() {
      return this.platillosCocina.length;
    },

    ventasTurno() {
      return this.ordenesPagadas.reduce((s, o) => s + o.total, 0);
    },
    ticketPromedio() {
      return this.ordenesPagadas.length
        ? Math.round(this.ventasTurno / this.ordenesPagadas.length)
        : 0;
    },
    efectivoEnCaja() {
      return this.caja.base + this.ventasTurno + this.caja.entradas - this.caja.salidas;
    },
  },

  methods: {
    money(n) {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
      }).format(n);
    },

    // Estado agregado de una orden a partir de sus platillos.
    estadoOrden(o) {
      if (o.pagada) return 'pagada';
      const estados = o.platillos.map(p => p.estado);
      if (estados.every(e => e === 'ventanilla')) return 'ventanilla';
      if (estados.some(e => e === 'cocinado' || e === 'ventanilla')) return 'cocinado';
      return 'proceso';
    },
    etiquetaEstado(e) {
      return {
        proceso: 'En proceso',
        cocinado: 'Cocinado',
        ventanilla: 'En ventanilla',
        pagada: 'Pagada',
      }[e];
    },
    siguienteAccion(e) {
      return e === 'proceso' ? 'Marcar cocinado' : 'Enviar a ventanilla';
    },

    // Cocinero avanza el estado del platillo.
    avanzarPlatillo(d) {
      if (d.ref.estado === 'proceso') {
        d.ref.estado = 'cocinado';
      } else if (d.ref.estado === 'cocinado') {
        d.ref.estado = 'ventanilla';
        // Aquí, en tu app real, dispararías el evento por WebSocket
        // hacia el mesero correspondiente. Simulamos la notificación:
        this.notificarVentanilla(d.nombre, d.mesa, d.mesero);
      }
    },

    notificarVentanilla(nombre, mesa, mesero) {
      const id = ++this._toastId;
      this.toasts.push({ id, nombre, mesa, mesero });
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 4000);
    },

    // Caja: sin caja abierta no hay nuevas órdenes; no se cierra con órdenes activas.
    abrirCaja() {
      this.caja.abierta = true;
    },
    cerrarCaja() {
      if (this.ordenesActivas.length) return;   // regla de negocio
      this.caja.abierta = false;
    },
    movimiento(tipo) {
      const raw = prompt(`Monto de la ${tipo === 'entrada' ? 'entrada' : 'salida'} de efectivo:`);
      const monto = Number(raw);
      if (!raw || isNaN(monto) || monto <= 0) return;
      if (tipo === 'entrada') this.caja.entradas += monto;
      else this.caja.salidas += monto;
    },
  },
}).mount('#app');