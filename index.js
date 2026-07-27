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

const empleado = mongoose.model("Empleado", empleadosSchema, "empleados");

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
        if (!categoriaEncontrada) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada"
            });
        }
        res.json(categoriaEncontrada);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener la categoría",
            error: error
        });
    }
});

// Crear una nueva categoría
app.post("/categorias", async (req, res) => {
    try {
        const {
            nombre,
            descripcion
        } = req.body;
        if(!nombre || !descripcion){
            return res.status(400).json({
                mensaje: "Faltan datos de la categoría"
            });
        }

        const nuevaCategoria = new categoria({
            nombre, descripcion
        });

        await nuevaCategoria.save();
        res.status(201).json({
            mensaje: "Categoría creada correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear la categoría",
            error: error
        })
    }
});

// Actualizar categoría existente
app.put("/categorias/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const {nombre, descripcion} = req.body;

        const categoriaActualizada = await categoria.findByIdAndUpdate(id, { nombre, descripcion}, { new: true});

        if (!categoriaActualizada) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada"
            });
        }

        res.json({
            mensaje: "Categoría actualizada exitosamente",
            categoria: categoriaActualizada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar la categoría",
            error: error
        });
    }
});

// Eliminar una categoría existente
app.delete("/categorias/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const categoriaEliminada = await categoria.findByIdAndDelete(id);

        if (!categoriaEliminada) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada"
            });
        }

        res.json({
            mensaje: "Categoría eliminada exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar la categoría",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN MENÚ-----------------
// Obtener todos los platillos del menú
app.get("/menu", async (req, res) => {
    try {
        const platillos = await menues.find().populate("categoria");
        res.json(platillos);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el menú",
            error: error
        });
    }
});

// Obtener un platillo del menú por su ID
app.get("/menu/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const platilloEncontrado = await menues.findById(id).populate("categoria");
        if (!platilloEncontrado) {
            return res.status(404).json({
                mensaje: "Platillo no encontrado"
            });
        }
        res.json(platilloEncontrado);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el platillo",
            error: error
        });
    }
});

// Crear un nuevo platillo del menú
app.post("/menu", async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            precio,
            categoria,
            clasificacion,
            imagen
        } = req.body;

        if (!nombre || !descripcion || precio == null) {
            return res.status(400).json({
                mensaje: "Faltan datos del platillo"
            });
        }

        const nuevoPlatillo = new menues({
            nombre, descripcion, precio, categoria, clasificacion, imagen
        });

        await nuevoPlatillo.save();
        res.status(201).json({
            mensaje: "Platillo creado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el platillo",
            error: error
        });
    }
});

// Actualizar un platillo del menú existente
app.put("/menu/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, descripcion, precio, categoria, clasificacion, imagen } = req.body;

        const platilloActualizado = await menues.findByIdAndUpdate(
            id,
            { nombre, descripcion, precio, categoria, clasificacion, imagen },
            { new: true }
        );

        if (!platilloActualizado) {
            return res.status(404).json({
                mensaje: "Platillo no encontrado"
            });
        }

        res.json({
            mensaje: "Platillo actualizado exitosamente",
            platillo: platilloActualizado
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el platillo",
            error: error
        });
    }
});

// Eliminar un platillo del menú
app.delete("/menu/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const platilloEliminado = await menues.findByIdAndDelete(id);

        if (!platilloEliminado) {
            return res.status(404).json({
                mensaje: "Platillo no encontrado"
            });
        }

        res.json({
            mensaje: "Platillo eliminado exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar el platillo",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN MESAS-----------------
// Obtener todas las mesas
app.get("/mesas", async (req, res) => {
    try {
        const mesas = await mesa.find();
        res.json(mesas);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener las mesas",
            error: error
        });
    }
});

// Obtener una mesa por su ID
app.get("/mesas/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const mesaEncontrada = await mesa.findById(id);
        if (!mesaEncontrada) {
            return res.status(404).json({
                mensaje: "Mesa no encontrada"
            });
        }
        res.json(mesaEncontrada);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener la mesa",
            error: error
        });
    }
});

// Crear una nueva mesa
app.post("/mesas", async (req, res) => {
    try {
        const { numero, capacidad } = req.body;

        if (!numero || !capacidad) {
            return res.status(400).json({
                mensaje: "Faltan datos de la mesa"
            });
        }

        const nuevaMesa = new mesa({
            numero, capacidad
        });

        await nuevaMesa.save();
        res.status(201).json({
            mensaje: "Mesa creada correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear la mesa",
            error: error
        });
    }
});

// Actualizar una mesa existente
app.put("/mesas/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { numero, capacidad } = req.body;

        const mesaActualizada = await mesa.findByIdAndUpdate(id, { numero, capacidad }, { new: true });

        if (!mesaActualizada) {
            return res.status(404).json({
                mensaje: "Mesa no encontrada"
            });
        }

        res.json({
            mensaje: "Mesa actualizada exitosamente",
            mesa: mesaActualizada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar la mesa",
            error: error
        });
    }
});

// Eliminar una mesa existente
app.delete("/mesas/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const mesaEliminada = await mesa.findByIdAndDelete(id);

        if (!mesaEliminada) {
            return res.status(404).json({
                mensaje: "Mesa no encontrada"
            });
        }

        res.json({
            mensaje: "Mesa eliminada exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar la mesa",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN EMPLEADOS-----------------
// Obtener todos los empleados
app.get("/empleados", async (req, res) => {
    try {
        const empleados = await empleado.find().populate("mesaAsignada");
        res.json(empleados);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los empleados",
            error: error
        });
    }
});

// Obtener un empleado por su ID
app.get("/empleados/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const empleadoEncontrado = await empleado.findById(id).populate("mesaAsignada");
        if (!empleadoEncontrado) {
            return res.status(404).json({
                mensaje: "Empleado no encontrado"
            });
        }
        res.json(empleadoEncontrado);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el empleado",
            error: error
        });
    }
});

// Crear un nuevo empleado
app.post("/empleados", async (req, res) => {
    try {
        const { nombre, cargo, edad, sueldo, mesaAsignada } = req.body;

        if (!nombre || !cargo) {
            return res.status(400).json({
                mensaje: "Faltan datos del empleado"
            });
        }

        const nuevoEmpleado = new empleado({
            nombre, cargo, edad, sueldo, mesaAsignada
        });

        await nuevoEmpleado.save();
        res.status(201).json({
            mensaje: "Empleado creado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el empleado",
            error: error
        });
    }
});

// Actualizar un empleado existente
app.put("/empleados/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, cargo, edad, sueldo, mesaAsignada } = req.body;

        const empleadoActualizado = await empleado.findByIdAndUpdate(
            id,
            { nombre, cargo, edad, sueldo, mesaAsignada },
            { new: true }
        );

        if (!empleadoActualizado) {
            return res.status(404).json({
                mensaje: "Empleado no encontrado"
            });
        }

        res.json({
            mensaje: "Empleado actualizado exitosamente",
            empleado: empleadoActualizado
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el empleado",
            error: error
        });
    }
});

// Eliminar un empleado existente
app.delete("/empleados/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const empleadoEliminado = await empleado.findByIdAndDelete(id);

        if (!empleadoEliminado) {
            return res.status(404).json({
                mensaje: "Empleado no encontrado"
            });
        }

        res.json({
            mensaje: "Empleado eliminado exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar el empleado",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN CHEFS-----------------
// Obtener todos los chefs
app.get("/chefs", async (req, res) => {
    try {
        const chefs = await chef.find().populate("especialidad");
        res.json(chefs);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los chefs",
            error: error
        });
    }
});

// Obtener un chef por su ID
app.get("/chefs/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const chefEncontrado = await chef.findById(id).populate("especialidad");
        if (!chefEncontrado) {
            return res.status(404).json({
                mensaje: "Chef no encontrado"
            });
        }
        res.json(chefEncontrado);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el chef",
            error: error
        });
    }
});

// Crear un nuevo chef
app.post("/chefs", async (req, res) => {
    try {
        const { nombre, posicion, especialidad } = req.body;

        if (!nombre || !posicion) {
            return res.status(400).json({
                mensaje: "Faltan datos del chef"
            });
        }

        const nuevoChef = new chef({
            nombre, posicion, especialidad
        });

        await nuevoChef.save();
        res.status(201).json({
            mensaje: "Chef creado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el chef",
            error: error
        });
    }
});

// Actualizar un chef existente
app.put("/chefs/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, posicion, especialidad } = req.body;

        const chefActualizado = await chef.findByIdAndUpdate(
            id,
            { nombre, posicion, especialidad },
            { new: true }
        );

        if (!chefActualizado) {
            return res.status(404).json({
                mensaje: "Chef no encontrado"
            });
        }

        res.json({
            mensaje: "Chef actualizado exitosamente",
            chef: chefActualizado
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el chef",
            error: error
        });
    }
});

// Eliminar un chef existente
app.delete("/chefs/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const chefEliminado = await chef.findByIdAndDelete(id);

        if (!chefEliminado) {
            return res.status(404).json({
                mensaje: "Chef no encontrado"
            });
        }

        res.json({
            mensaje: "Chef eliminado exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar el chef",
            error: error
        });
    }
});