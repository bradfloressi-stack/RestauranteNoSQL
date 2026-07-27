const express = require('express');
const morgan = require('morgan');
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

mongoose.connect("mongodb+srv://bradfloressi_db_user:hola123@serverrestaurante.qcmhzkz.mongodb.net/Restaurante?appName=ServerRestaurante").then(() => {
    console.log("Conectado a la base de datos");
}).catch((err) => {
    console.log("Error al conectar a la base de datos", err);
});

// Definición del esquema de categorías
const categoriasSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String
},
{
    timestamps: true
});

const categoria = mongoose.model("Categoria", categoriasSchema, "categorias")
// Definición del esquema del menú
const menuSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    precio: Number,
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categorias"
    },
    clasificacion: String, // Desayuno, comida, cena, entrada, bebida
    imagen: String
},
{
    timestamps: true
});

const menues = mongoose.model("Menu", menuSchema);

// Definición del esquema de mesas
const mesasSchema = new mongoose.Schema({
    numero: Number,
    capacidad: Number
}, {
    timestamps: true
});

const mesa = mongoose.model("Mesa", mesasSchema);

// Definición del esquema empleados
const empleadosSchema = new mongoose.Schema({
    nombre: String,
    cargo: String,
    edad: Number,
    sueldo: Number,

    mesaAsignada: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "mesas"
    }

}, {
    timestamps: true
});

// Definición del esquema chefs
const chefsSchema = new mongoose.Schema({
    nombre: String,
    posicion: String, //Principal, carnes, presentación
    especialidad:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "categorias"
    }
}, {
    timestamps: true
});

const chef = mongoose.model("Chef", chefsSchema, "chefs");
// Mensaje de iniciación del servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

//--------------------------------------------------------------
//------------------------------APIs----------------------------
//..............................................................

//------------------------RUTA PRINCIPAL DEL SERVIDOR------------
app.get('/', (req, res) => {
    res.send('API Restaurantes. Administración');
});


// -----------------RUTAS PARA LA COLECCIÓN CATEGORÍAS-----------
// Obtener todas las categorías
app.get("/categorias", async (req, res) => {
    try{
        const categorias = await categoria.find();
        res.json(categorias);
    } catch (error){
        res.status(500).json({
            mensaje: "Error al obtener las categorías",
            error: error
        });
    }
});

// Obtener una categoría por su ID
app.get("/categorias/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const categoriaEncontrada = await categoria.findById(id);
        if (!serieEncontrada) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada"
            });
        }
        res.json(categoriaEncontrada);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener la serie",
            error: error
        });
    }
});

// Crear una nueva categoría
