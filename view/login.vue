<template>
    <h1>login Cabron</h1>
    <form @submit.prevent="login">
        <input v-model="username" type="text" placeholder="Tu usuario">
        <input v-model="password" type="password" placeholder="Tu contraseña">
        <button type="submit">Login</button>
    </input>
    </form>
</template>

<script>
    import {ref} from 'vue'

    const username = ref('')
    const password = ref('')

</script>

<style>

</style>