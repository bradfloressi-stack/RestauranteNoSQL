require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const serverless = require('serverless-http');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Reutiliza la conexión entre invocaciones (evita reconectar en cada request)
let conexionLista = false;
async function conectarDB() {
    if (conexionLista) return;
    await mongoose.connect(process.env.MONGO_URI);
    conexionLista = true;
    console.log("Conectado a la base de datos");
}
app.use(async (req, res, next) => {
    try {
        await conectarDB();
        next();
    } catch (err) {
        res.status(500).json({ mensaje: "Error al conectar a la base de datos", error: err.message });
    }
});

// ... aquí van TODOS tus schemas, modelos y rutas exactamente igual que en tu index.js actual,
// PERO quita el app.listen() del final — Vercel no lo necesita.

module.exports = app;
module.exports.handler = serverless(app);