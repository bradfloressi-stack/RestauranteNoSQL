import { createRouter, createWebHistory } from 'vue-router'
import Login from '../login.vue'
import AdminPanel from '../AdminPanel.vue'
import Mesero from '../Mesero.vue'
import Cocina from '../Cocina.vue'
import { rutaPorRol } from './roles'

// Cada ruta protegida declara qué rol(es) puede entrar en meta.roles.
const routes = [
  {
    path: '/',
    name: 'login',
    component: Login,
    meta: { public: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPanel,
    meta: { roles: ['cajero'] },
  },
  {
    path: '/mesero',
    name: 'mesero',
    component: Mesero,
    meta: { roles: ['mesero'] },
  },
  {
    path: '/cocina',
    name: 'cocina',
    component: Cocina,
    meta: { roles: ['cocinero'] },
  },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

function usuarioActual() {
  const raw = localStorage.getItem('usuario')
  return raw ? JSON.parse(raw) : null
}

router.beforeEach((to) => {
  const usuario = usuarioActual()

  if (to.meta.public) {
    if (usuario) return rutaPorRol[usuario.rol] || '/'
    return true
  }

  if (!usuario) return '/'

  if (to.meta.roles && !to.meta.roles.includes(usuario.rol)) {
    return rutaPorRol[usuario.rol] || '/'
  }

  return true
})

export default router
