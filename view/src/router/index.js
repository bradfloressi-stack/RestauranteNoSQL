import { createRouter, createWebHistory } from 'vue-router'
import Login from '../login.vue'
import AdminPanel from '../AdminPanel.vue'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function usuarioActual() {
  const raw = localStorage.getItem('usuario')
  return raw ? JSON.parse(raw) : null
}

// Ruta de cada rol una vez logueado.
const rutaPorRol = {
  cajero: '/admin',
  mesero: '/admin',
  cocinero: '/admin',
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
