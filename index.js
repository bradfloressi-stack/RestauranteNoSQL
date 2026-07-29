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

// Definición del esquema roles
const rolesSchema = new mongoose.Schema({
    nombre: String
},{
    timestamps: true
});

const rol = mongoose.model("Rol", rolesSchema, "roles");

// Definición del esquema Usuarios
const usuariosSchema = new mongoose.Schema({
    nombreCompleto: String,
    usuario: String,
    contrasena: String,
    rol:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "roles"
    }
},{
    timestamps: true
});

const usuario = mongoose.model("Usuario", usuariosSchema, "usuarios");

// Definición del esquema ordenes
const ordenesSchema = new mongoose.Schema({
    platillo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "menu"
    },
    mesa:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "mesas"
    }
},{
    timestamps: true
});

const orden = mongoose.model("Orden", ordenesSchema, "ordenes");
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


// -----------------RUTAS PARA LA COLECCIÓN ROLES-----------------
// Obtener todos los roles
app.get("/roles", async (req, res) => {
    try {
        const roles = await rol.find();
        res.json(roles);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los roles",
            error: error
        });
    }
});

// Obtener un rol por su ID
app.get("/roles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const rolEncontrado = await rol.findById(id);
        if (!rolEncontrado) {
            return res.status(404).json({
                mensaje: "Rol no encontrado"
            });
        }
        res.json(rolEncontrado);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el rol",
            error: error
        });
    }
});

// Crear un nuevo rol
app.post("/roles", async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                mensaje: "Faltan datos del rol"
            });
        }

        const nuevoRol = new rol({
            nombre
        });

        await nuevoRol.save();
        res.status(201).json({
            mensaje: "Rol creado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el rol",
            error: error
        });
    }
});

// Actualizar un rol existente
app.put("/roles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre } = req.body;

        const rolActualizado = await rol.findByIdAndUpdate(id, { nombre }, { new: true });

        if (!rolActualizado) {
            return res.status(404).json({
                mensaje: "Rol no encontrado"
            });
        }

        res.json({
            mensaje: "Rol actualizado exitosamente",
            rol: rolActualizado
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el rol",
            error: error
        });
    }
});

// Eliminar un rol existente
app.delete("/roles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const rolEliminado = await rol.findByIdAndDelete(id);

        if (!rolEliminado) {
            return res.status(404).json({
                mensaje: "Rol no encontrado"
            });
        }

        res.json({
            mensaje: "Rol eliminado exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar el rol",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN USUARIOS-----------------
// Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
    try {
        const usuarios = await usuario.find().populate("rol");
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los usuarios",
            error: error
        });
    }
});

// Obtener un usuario por su ID
app.get("/usuarios/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const usuarioEncontrado = await usuario.findById(id).populate("rol");
        if (!usuarioEncontrado) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }
        res.json(usuarioEncontrado);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el usuario",
            error: error
        });
    }
});

// Crear un nuevo usuario
app.post("/usuarios", async (req, res) => {
    try {
        const { nombreCompleto, usuario: nombreUsuario, contrasena, rol } = req.body;

        if (!nombreCompleto || !nombreUsuario || !contrasena) {
            return res.status(400).json({
                mensaje: "Faltan datos del usuario"
            });
        }

        const nuevoUsuario = new usuario({
            nombreCompleto,
            usuario: nombreUsuario,
            contrasena,
            rol
        });

        await nuevoUsuario.save();
        res.status(201).json({
            mensaje: "Usuario creado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el usuario",
            error: error
        });
    }
});

// Actualizar un usuario existente
app.put("/usuarios/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombreCompleto, usuario: nombreUsuario, contrasena, rol } = req.body;

        const usuarioActualizado = await usuario.findByIdAndUpdate(
            id,
            { nombreCompleto, usuario: nombreUsuario, contrasena, rol },
            { new: true }
        );

        if (!usuarioActualizado) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            mensaje: "Usuario actualizado exitosamente",
            usuario: usuarioActualizado
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el usuario",
            error: error
        });
    }
});

// Eliminar un usuario existente
app.delete("/usuarios/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const usuarioEliminado = await usuario.findByIdAndDelete(id);

        if (!usuarioEliminado) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            mensaje: "Usuario eliminado exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar el usuario",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN ÓRDENES-----------------
// Obtener todas las órdenes
app.get("/ordenes", async (req, res) => {
    try {
        const ordenes = await orden.find().populate("platillo").populate("mesa");
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener las órdenes",
            error: error
        });
    }
});

// Obtener una orden por su ID
app.get("/ordenes/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const ordenEncontrada = await orden.findById(id).populate("platillo").populate("mesa");
        if (!ordenEncontrada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }
        res.json(ordenEncontrada);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener la orden",
            error: error
        });
    }
});

// Crear una nueva orden
app.post("/ordenes", async (req, res) => {
    try {
        const { platillo, mesa } = req.body;

        if (!platillo || !mesa) {
            return res.status(400).json({
                mensaje: "Faltan datos de la orden"
            });
        }

        const nuevaOrden = new orden({
            platillo, mesa
        });

        await nuevaOrden.save();
        res.status(201).json({
            mensaje: "Orden creada correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear la orden",
            error: error
        });
    }
});

// Actualizar una orden existente
app.put("/ordenes/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { platillo, mesa } = req.body;

        const ordenActualizada = await orden.findByIdAndUpdate(
            id,
            { platillo, mesa },
            { new: true }
        );

        if (!ordenActualizada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }

        res.json({
            mensaje: "Orden actualizada exitosamente",
            orden: ordenActualizada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar la orden",
            error: error
        });
    }
});

// Eliminar una orden existente
app.delete("/ordenes/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const ordenEliminada = await orden.findByIdAndDelete(id);

        if (!ordenEliminada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }

        res.json({
            mensaje: "Orden eliminada exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar la orden",
            error: error
        });
    }
});