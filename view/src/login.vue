<template>
  <div class="login-page">
    <div class="login-card">
      <!-- ====== HEADER ====== -->
      <div class="header">
        <div class="logo-box">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M5 9h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6V9Z"
              stroke="#e8c88a"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path
              d="M17 10h1.5a2 2 0 0 1 0 4H17"
              stroke="#e8c88a"
              stroke-width="1.6"
              stroke-linecap="round"
            />
            <path
              d="M4 21h14"
              stroke="#e8c88a"
              stroke-width="1.6"
              stroke-linecap="round"
            />
            <path
              d="M8 3.5c-.6.7-.6 1.3 0 2M11 3.5c-.6.7-.6 1.3 0 2"
              stroke="#e8c88a"
              stroke-width="1.4"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div>
          <h1>Cantina Central</h1>
          <p class="subtitle">Sistema de gestión</p>
        </div>
      </div>

      <!-- ====== FORM (se oculta durante la carga) ====== -->
      <form v-if="!cargando" @submit.prevent="login" class="form">
        <div class="field">
          <label>Usuario</label>
          <div class="input-wrap">
            <input
              v-model="username"
              type="text"
              placeholder="usuario"
              autocomplete="username"
            />
            <svg
              class="input-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
            >
              <circle
                cx="12"
                cy="8.2"
                r="3.4"
                stroke="#8a8f89"
                stroke-width="1.5"
              />
              <path
                d="M5 20c1.1-3.6 4-5.4 7-5.4s5.9 1.8 7 5.4"
                stroke="#8a8f89"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <rect
                x="15.2"
                y="10.6"
                width="6.4"
                height="5.6"
                rx="1.3"
                fill="#e08a2c"
              />
              <path
                d="M16.6 10.6v-1.3a1.8 1.8 0 0 1 3.6 0v1.3"
                stroke="#e08a2c"
                stroke-width="1.3"
                fill="none"
              />
            </svg>
          </div>
        </div>

        <div class="field">
          <label>Contraseña</label>
          <div class="input-wrap">
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="submit-btn">Iniciar sesión</button>

        <div class="demo-divider"></div>
        <p class="demo-text">
          Demo — usuarios de prueba:<br />
          carlos / 1234 (mesero) · ana / 1234 (cocina) · jorge / 1234 (admin)
        </p>
      </form>

      <!-- ====== PANTALLA DE CARGA: escena de cocina ====== -->
      <div v-else class="loading-screen">
        <svg
          class="kitchen-scene"
          viewBox="0 0 220 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- mostrador de fondo -->
          <rect
            x="0"
            y="18"
            width="220"
            height="120"
            fill="#16211b"
            opacity="0.6"
          />

          <!-- alacena izquierda -->
          <rect
            x="14"
            y="26"
            width="46"
            height="58"
            rx="4"
            fill="#2c4535"
            stroke="#3a5a44"
            stroke-width="2"
          />
          <circle
            class="jar"
            cx="37"
            cy="55"
            r="10"
            fill="#e8c88a"
            opacity="0.55"
          />
          <rect
            x="32"
            y="42"
            width="10"
            height="6"
            rx="1.5"
            fill="#e8c88a"
            opacity="0.55"
          />

          <!-- reloj derecho -->
          <circle
            cx="188"
            cy="46"
            r="16"
            fill="#2c4535"
            stroke="#3a5a44"
            stroke-width="2"
          />
          <line
            x1="188"
            y1="46"
            x2="188"
            y2="36"
            stroke="#e8c88a"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="188"
            y1="46"
            x2="195"
            y2="46"
            stroke="#e8c88a"
            stroke-width="2"
            stroke-linecap="round"
          />

          <!-- cubierta / franja de mostrador -->
          <rect x="0" y="86" width="220" height="14" fill="#0f1a13" />
          <line
            x1="0"
            y1="86"
            x2="220"
            y2="86"
            stroke="#3a5a44"
            stroke-width="2"
          />

          <!-- sartén -->
          <ellipse
            cx="110"
            cy="128"
            rx="42"
            ry="14"
            fill="#1f3327"
            stroke="#e8c88a"
            stroke-width="2.5"
          />
          <rect
            x="150"
            y="123"
            width="34"
            height="8"
            rx="4"
            fill="#1f3327"
            stroke="#e8c88a"
            stroke-width="2"
          />

          <!-- flama -->
          <g class="flame" style="transform-origin: 110px 142px">
            <path
              d="M110 148c-7 -6 -8 -14 -3 -22c1 6 4 8 6 6c-1 6 2 9 5 8c4 -2 4 -9 0 -14c8 6 9 16 3 24c-3 3 -7 -1 -11 -2Z"
              fill="#e07a1f"
            />
            <path
              d="M110 146c-4 -4 -4.5 -9 -1.5 -14c0.6 3.5 2.3 4.5 3.5 3.5c-0.5 3.5 1.2 5.5 3 5c2.3 -0.8 2.3 -5.5 0 -8.5c5 3.5 5.5 10 1.7 15c-1.8 2 -4.2 -0.3 -6.7 -1Z"
              fill="#f5b942"
            />
          </g>

          <!-- verduras en la sartén -->
          <g class="veggie veggie-1">
            <path
              d="M92 122c8 -2 15 3 16 9c-6 1 -14 -1 -16 -9Z"
              fill="#e8792c"
            />
            <path
              d="M92 122c-2 -3 -3 -6 -2 -8M95 121c-1 -3 -1 -5 0 -7"
              stroke="#4d8047"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </g>
          <g class="veggie veggie-2">
            <circle cx="112" cy="120" r="7" fill="#3f6b3a" />
            <circle cx="108" cy="115" r="4.5" fill="#4d8047" />
            <circle cx="116" cy="115" r="4.5" fill="#4d8047" />
          </g>
          <g class="veggie veggie-3">
            <circle cx="128" cy="121" r="6.5" fill="#c2382b" />
            <path
              d="M125 118c1 -1 3 -1 4 0M124 121c1.5 -0.5 3.5 -0.5 5 0.3"
              stroke="#e07a6a"
              stroke-width="1"
              stroke-linecap="round"
            />
          </g>

          <!-- vapor -->
          <path
            class="steam steam-1"
            d="M96 108c-3 -4 3 -6 0 -10"
            stroke="#e8c88a"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          />
          <path
            class="steam steam-2"
            d="M112 104c-3 -4 3 -6 0 -10"
            stroke="#e8c88a"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          />
          <path
            class="steam steam-3"
            d="M128 108c-3 -4 3 -6 0 -10"
            stroke="#e8c88a"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          />
        </svg>

        <p class="loading-text">Preparando la mesa…</p>
      </div>
    </div>

    <!-- ====== TOASTS DE CONFIRMACIÓN ====== -->
    <transition name="toast-fade">
      <div v-if="toastType" class="toast">
        <!-- Mesa agregada -->
        <svg
          v-if="toastType === 'mesa'"
          class="toast-icon icon-mesa"
          viewBox="0 0 32 32"
          width="26"
          height="26"
        >
          <rect x="4" y="14" width="18" height="4" rx="1.5" fill="#e8c88a" />
          <circle
            cx="24"
            cy="16"
            r="6"
            fill="#fff"
            stroke="#2f4d3a"
            stroke-width="1.5"
          />
          <circle cx="24" cy="16" r="2.4" fill="#3f6b3a" />
        </svg>

        <!-- Venta registrada -->
        <svg
          v-else-if="toastType === 'venta'"
          class="toast-icon"
          viewBox="0 0 32 32"
          width="26"
          height="26"
        >
          <rect x="8" y="16" width="16" height="12" rx="2" fill="#16211b" />
          <circle
            class="coin coin-1"
            cx="14"
            cy="10"
            r="4"
            fill="#e8c88a"
            stroke="#c2a05c"
            stroke-width="1"
          />
          <circle
            class="coin coin-2"
            cx="21"
            cy="8"
            r="4"
            fill="#e8c88a"
            stroke="#c2a05c"
            stroke-width="1"
          />
        </svg>

        <!-- Orden enviada a cocina -->
        <svg
          v-else-if="toastType === 'orden'"
          class="toast-icon"
          viewBox="0 0 32 32"
          width="26"
          height="26"
        >
          <path
            class="steam ts-1"
            d="M11 8c-2 -3 2 -4 0 -7"
            stroke="#e8c88a"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
          />
          <path
            class="steam ts-2"
            d="M20 8c-2 -3 2 -4 0 -7"
            stroke="#e8c88a"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
          />
          <rect x="7" y="10" width="18" height="18" rx="2" fill="#fff" />
          <line
            x1="10"
            y1="16"
            x2="22"
            y2="16"
            stroke="#2f4d3a"
            stroke-width="1.6"
          />
          <line
            x1="10"
            y1="20"
            x2="22"
            y2="20"
            stroke="#2f4d3a"
            stroke-width="1.6"
          />
          <line
            x1="10"
            y1="24"
            x2="18"
            y2="24"
            stroke="#2f4d3a"
            stroke-width="1.6"
          />
        </svg>

        <!-- Platillo entregado -->
        <svg
          v-else-if="toastType === 'platillo'"
          class="toast-icon"
          viewBox="0 0 32 32"
          width="26"
          height="26"
        >
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="#fff"
            stroke="#2f4d3a"
            stroke-width="1.5"
          />
          <path
            class="check"
            d="M10 16.5l4 4l8 -9"
            fill="none"
            stroke="#3f6b3a"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </transition>
  </div>
</template>

<script>
import { rutaPorRol } from "./router/roles";

export default {
  data() {
    return {
      username: "",
      password: "",
      error: "",
      cargando: false,
      toastType: null,
    };
  },
  methods: {
    async login() {
      this.error = "";

      if (!this.username.trim() || !this.password) {
        this.error = "Ingresa usuario y contraseña.";
        return;
      }

      this.cargando = true;
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: this.username.trim(),
            password: this.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.error = data.mensaje || "Usuario o contraseña incorrectos.";
          return;
        }

        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        this.$router.push(rutaPorRol[data.usuario.rol] || "/admin");
      } catch (err) {
        this.error = "No se pudo conectar con el servidor.";
        console.error(err);
      } finally {
        this.cargando = false;
      }
    },

    // Llamable desde cualquier vista de la app: this.showToast('venta'), etc.
    // Tipos disponibles: 'mesa' | 'venta' | 'orden' | 'platillo'
    showToast(tipo) {
      this.toastType = tipo;
      setTimeout(() => {
        this.toastType = null;
      }, 1700);
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4efe6;
  font-family: "Segoe UI", system-ui, sans-serif;
}

.login-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  padding: 40px 36px;
}

/* header */
.header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.logo-box {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #2f4d3a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.header h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  color: #2f4d3a;
  font-size: 26px;
}
.subtitle {
  margin: 2px 0 0;
  color: #8a8f89;
  font-size: 14px;
}

/* form */
.field {
  margin-bottom: 18px;
}
.field label {
  display: block;
  font-weight: 600;
  color: #1f2a22;
  margin-bottom: 8px;
  font-size: 14px;
}
.input-wrap {
  position: relative;
}
.input-wrap input {
  width: 100%;
  padding: 13px 44px 13px 14px;
  border: 1px solid #e2ddd2;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  background: #fff;
}
.input-wrap input:focus {
  border-color: #2f4d3a;
}
.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.error {
  color: #b91c1c;
  font-size: 13px;
  margin: -6px 0 14px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #2f4d3a;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.submit-btn:hover {
  background: #26402f;
}

.demo-divider {
  border-top: 1px solid #ece7dc;
  margin: 22px 0 14px;
}
.demo-text {
  color: #9a9d97;
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* ===================== LOADING SCREEN ===================== */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}
.kitchen-scene {
  width: 220px;
  height: 180px;
}
.loading-text {
  margin-top: 14px;
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  color: #2f4d3a;
  font-size: 19px;
}

/* frasco titilante */
.jar {
  animation: jarGlint 2.4s ease-in-out infinite;
}
@keyframes jarGlint {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
  }
}

/* flama */
.flame {
  animation: flameFlicker 0.5s ease-in-out infinite;
}
@keyframes flameFlicker {
  0% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.95;
  }
  50% {
    transform: scaleY(1.18) scaleX(0.92);
    opacity: 0.8;
  }
  100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.95;
  }
}

/* verduras saltando */
.veggie {
  animation: veggieHop 0.9s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
.veggie-1 {
  animation-delay: 0s;
}
.veggie-2 {
  animation-delay: 0.15s;
}
.veggie-3 {
  animation-delay: 0.3s;
}
@keyframes veggieHop {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-9px) rotate(35deg);
  }
}

/* vapor de la sartén */
.steam {
  animation: loadSteam 1.6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: bottom center;
}
.steam-1 {
  animation-delay: 0s;
}
.steam-2 {
  animation-delay: 0.4s;
}
.steam-3 {
  animation-delay: 0.8s;
}
@keyframes loadSteam {
  0% {
    opacity: 0;
    transform: translateY(0) scaleX(1);
  }
  50% {
    opacity: 0.6;
    transform: translateY(-16px) scaleX(1.4);
  }
  100% {
    opacity: 0;
    transform: translateY(-16px) scaleX(1.4);
  }
}

/* ===================== TOASTS ===================== */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #2f4d3a;
  padding: 10px 18px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  animation: animPop 1.7s ease both;
}
@keyframes animPop {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(14px) scale(0.85);
  }
  10% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  88% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px) scale(0.9);
  }
}

/* mesa agregada */
.icon-mesa {
  animation: trayPlateIn 0.6s ease-out;
}
@keyframes trayPlateIn {
  0% {
    transform: translateX(-22px) rotate(-8deg);
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
}

/* venta registrada */
.coin {
  transform-box: fill-box;
  transform-origin: center;
}
.coin-1 {
  animation: coinDrop1 0.7s ease-out;
}
.coin-2 {
  animation: coinDrop2 0.8s ease-out 0.1s both;
}
@keyframes coinDrop1 {
  0% {
    transform: translateY(-16px) rotate(0deg);
    opacity: 0;
  }
  100% {
    transform: translateY(0) rotate(360deg);
    opacity: 1;
  }
}
@keyframes coinDrop2 {
  0% {
    transform: translateY(-22px) rotate(0deg);
    opacity: 0;
  }
  100% {
    transform: translateY(0) rotate(-360deg);
    opacity: 1;
  }
}

/* orden enviada a cocina */
.ts-1,
.ts-2 {
  animation: ticketSteam 1.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: bottom center;
}
.ts-2 {
  animation-delay: 0.4s;
}
@keyframes ticketSteam {
  0% {
    opacity: 0;
    transform: translateY(0) scaleX(1);
  }
  50% {
    opacity: 0.6;
    transform: translateY(-10px) scaleX(1.4);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scaleX(1.4);
  }
}

/* platillo entregado */
.check {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: checkDraw 0.5s ease-out 0.3s forwards;
}
@keyframes checkDraw {
  to {
    stroke-dashoffset: 0;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>
