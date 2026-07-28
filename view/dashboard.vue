<template>
  <div class="dashboard">
    <h2 class="panel-title">Panel de control ({{ roleLabel }})</h2>
    <p class="panel-subtitle">
      Selecciona una opción del menú o una de las tarjetas para comenzar a trabajar.
    </p>

    <div class="cards-grid">
      <RouterLink
        v-for="card in dashboardCards"
        :key="card.route"
        :to="card.route"
        class="card"
      >
        <span class="card-icon" v-html="ICONS[card.icon]"></span>
        <div>
          <h3 class="card-title">{{ card.label }}</h3>
          <p class="card-desc">{{ card.description }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useMenu } from '../composables/useMenu'
import { normalizeRole, ROLE_LABELS } from '../utils/roles'
import { ICONS } from '../utils/icons'

const auth = useAuthStore()
const { menuItems } = useMenu()

const DESCRIPTIONS = {
  Ventas:     'Registrar y gestionar ventas.',
  Productos:  'Administrar productos del catálogo.',
  Clientes:   'Consultar o registrar clientes.',
  Inventario: 'Consultar el inventario por sucursal.',
  Usuarios:   'Gestionar usuarios del sistema.',
  Reportes:   'Ver reportes y estadísticas.',
  Créditos:   'Gestionar créditos de clientes.',
  Tickets:    'Consultar y reimprimir tickets.',
}

const roleLabel = computed(() =>
  ROLE_LABELS[normalizeRole(auth.rol)] ?? auth.rol ?? ''
)

const dashboardCards = computed(() =>
  menuItems.value
    .filter(item => item.label !== 'Inicio')
    .map(item => ({ ...item, description: DESCRIPTIONS[item.label] ?? '' }))
)
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a3a4a;
  margin: 0 0 6px;
}

.panel-subtitle {
  color: #666;
  font-size: 0.93rem;
  margin: 0 0 28px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e4e7ec;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.15s;
}

.card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

.card-icon {
  color: #1a3a4a;
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a3a4a;
  margin: 0 0 4px;
}

.card-desc {
  font-size: 0.83rem;
  color: #888;
  margin: 0;
}
</style>