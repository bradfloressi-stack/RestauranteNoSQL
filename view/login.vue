<template>
  <div class="login-page">
    <form @submit.prevent="login">
      <h1>Iniciar sesión</h1>
      <input v-model="username" type="text" placeholder="Tu usuario" />
      <input v-model="password" type="password" placeholder="Tu contraseña" />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Entrando…' : 'Login' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      error: '',
      cargando: false,
    }
  },
  methods: {
    async login() {
      this.error = ''

      if (!this.username.trim() || !this.password) {
        this.error = 'Ingresa usuario y contraseña.'
        return
      }

      this.cargando = true
      try {
        // La URL del backend viene de una variable de entorno de Vite.
        // En desarrollo apunta a tu servidor local; en producción,
        // a donde despliegues el backend.
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario: this.username.trim(),
            password: this.password,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          this.error = data.mensaje || 'Usuario o contraseña incorrectos.'
          return
        }

        // Guardamos el usuario logueado para que otras vistas sepan quién entró.
        // Ver session.js para el detalle de por qué existe este archivo.
        localStorage.setItem('usuario', JSON.stringify(data.usuario))

        console.log('Login exitoso:', data.usuario)
        // Aquí, cuando tengamos vue-router, redirigiríamos según data.usuario.rol
        // this.$router.push('/dashboard')
      } catch (err) {
        this.error = 'No se pudo conectar con el servidor.'
        console.error(err)
      } finally {
        this.cargando = false
      }
    },
  },
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 320px;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 10px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

button {
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #111827;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #b91c1c;
  font-size: 13px;
  margin: 0;
}
</style>
