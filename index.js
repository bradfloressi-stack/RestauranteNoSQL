require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(morgan('dev'));

app.use(cors());

mongoose.connect(process.env.MONGO_URI).then(() => {
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
        ref: "Categoria"
    },
    clasificacion: String, // Desayuno, comida, cena, entrada, bebida
    imagen: String
},
{
    timestamps: true
});

const menues = mongoose.model("menu", menuSchema, "menu");

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
        ref: "Mesa"
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
        ref: "Categoria"
    }
}, {
    timestamps: true
});

const chef = mongoose.model("Chef", chefsSchema, "chefs");

// Definición del esquema de órdenes
// Cada platillo va embebido con su propio estado (proceso -> cocinado -> ventanilla).
// Guardamos nombre y precio "congelados" al momento de ordenar, para que si el
// menú cambia después, las órdenes viejas no se vean afectadas.
const platilloOrdenSchema = new mongoose.Schema({
    menu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu"
    },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    estado: {
        type: String,
        enum: ["proceso", "cocinado", "ventanilla"],
        default: "proceso"
    },
    entregado: { type: Boolean, default: false }
}, { _id: true });

const ordenSchema = new mongoose.Schema({
    mesa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mesa"
    },
    mesero: {
        // Antes apuntaba a "Empleado", pero quien crea la orden es el Usuario
        // que inició sesión (colección de login), no un Empleado. Con la
        // referencia anterior populate("mesero") nunca encontraba nada.
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario"
    },
    platillos: [platilloOrdenSchema],
    total: { type: Number, default: 0 },
    pagada: { type: Boolean, default: false },
    nota: { type: String, default: "" }
}, {
    timestamps: true
});

const orden = mongoose.model("Orden", ordenSchema, "ordenes");

// Definición del esquema de movimientos de caja
// tipo: apertura / cierre -> marcan el inicio y fin de un turno de caja
//       entrada / salida   -> movimientos manuales de efectivo (mesero pide cambio, etc.)
//       venta               -> se genera automáticamente al cobrar una orden
const movimientoCajaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ["apertura", "cierre", "entrada", "salida", "venta"],
        required: true
    },
    monto: { type: Number, required: true },
    cajero: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empleado"
    },
    orden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orden"
    },
    descripcion: String
}, {
    timestamps: true
});

const movimientoCaja = mongoose.model("MovimientoCaja", movimientoCajaSchema, "movimientosCaja");

// Misma regla que usa GET /caja/estado: si no hay movimientos o el último
// fue un "cierre", la caja está cerrada. Se reutiliza para bloquear la
// creación de órdenes cuando no hay turno de caja abierto.
async function cajaEstaAbierta() {
    const ultimoMovimiento = await movimientoCaja.findOne().sort({ createdAt: -1 });
    if (!ultimoMovimiento || ultimoMovimiento.tipo === "cierre") return false;
    return true;
}

// Definición del esquema de usuarios (login)
const usuariosSchema = new mongoose.Schema({
    usuario: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    nombre: { type: String, required: true },
    rol: { type: String, required: true, enum: ["mesero", "cocinero", "cajero"] },
    activo: { type: Boolean, default: true }
}, {
    timestamps: true
});

const usuario = mongoose.model("Usuario", usuariosSchema, "usuarios");

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


// -----------------RUTAS PARA LA COLECCIÓN ÓRDENES-----------------
// Obtener todas las órdenes (con datos de mesa y mesero)
app.get("/ordenes", async (req, res) => {
    try {
        const ordenes = await orden.find()
            .populate("mesa")
            .populate("mesero")
            .sort({ createdAt: -1 });
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener las órdenes",
            error: error
        });
    }
});

// Órdenes activas (no pagadas) -> útil para las vistas de cocina y mesero
app.get("/ordenes/activas", async (req, res) => {
    try {
        const ordenes = await orden.find({ pagada: false })
            .populate("mesa")
            .populate("mesero")
            .sort({ createdAt: 1 });
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener las órdenes activas",
            error: error
        });
    }
});

// Obtener una orden por su ID
app.get("/ordenes/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const ordenEncontrada = await orden.findById(id)
            .populate("mesa")
            .populate("mesero");
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
// El body solo manda { mesa, mesero, platillos: [{ menu: "<id>" }, ...] }.
// Aquí buscamos cada platillo en el Menú para "congelar" nombre y precio,
// y calculamos el total automáticamente.
app.post("/ordenes", async (req, res) => {
    try {
        const { mesa, mesero, platillos, nota } = req.body;

        if (!mesa || !mesero || !Array.isArray(platillos) || platillos.length === 0) {
            return res.status(400).json({
                mensaje: "Faltan datos de la orden (mesa, mesero y al menos un platillo)"
            });
        }

        if (!(await cajaEstaAbierta())) {
            return res.status(400).json({
                mensaje: "No se pueden crear órdenes: la caja está cerrada"
            });
        }

        const idsMenu = platillos.map(p => p.menu);
        // $in no "multiplica" resultados por ids repetidos (2 tacos = mismo id
        // dos veces en el arreglo); Mongo regresa cada documento una sola vez.
        // Por eso se compara contra los ids ÚNICOS, no contra el arreglo completo.
        const idsMenuUnicos = [...new Set(idsMenu)];
        const platillosMenu = await menues.find({ _id: { $in: idsMenuUnicos } });

        if (platillosMenu.length !== idsMenuUnicos.length) {
            return res.status(400).json({
                mensaje: "Uno o más platillos del menú no existen"
            });
        }

        const platillosOrden = platillos.map(p => {
            const encontrado = platillosMenu.find(m => m._id.toString() === p.menu);
            return {
                menu: encontrado._id,
                nombre: encontrado.nombre,
                precio: encontrado.precio,
                estado: "proceso"
            };
        });

        const total = platillosOrden.reduce((suma, p) => suma + p.precio, 0);

        const nuevaOrden = new orden({
            mesa, mesero, platillos: platillosOrden, total, nota: nota || ""
        });

        await nuevaOrden.save();
        res.status(201).json({
            mensaje: "Orden creada correctamente",
            orden: nuevaOrden
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear la orden",
            error: error
        });
    }
});

// Avanzar el estado de UN platillo dentro de una orden (proceso -> cocinado -> ventanilla)
app.put("/ordenes/:id/platillos/:platilloId/avanzar", async (req, res) => {
    try {
        const { id, platilloId } = req.params;

        const ordenEncontrada = await orden.findById(id);
        if (!ordenEncontrada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }

        const platillo = ordenEncontrada.platillos.id(platilloId);
        if (!platillo) {
            return res.status(404).json({
                mensaje: "Platillo no encontrado dentro de la orden"
            });
        }

        const flujo = { proceso: "cocinado", cocinado: "ventanilla" };
        const siguiente = flujo[platillo.estado];

        if (!siguiente) {
            return res.status(400).json({
                mensaje: "El platillo ya está en ventanilla, no puede avanzar más"
            });
        }

        platillo.estado = siguiente;
        await ordenEncontrada.save();

        res.json({
            mensaje: "Platillo actualizado exitosamente",
            orden: ordenEncontrada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al avanzar el platillo",
            error: error
        });
    }
});

// Agregar platillos a una orden ya existente (lo usa el mesero al "editar" una
// orden que ya envió: los platillos nuevos entran a cocina como "proceso",
// los que ya estaban no se tocan). También permite actualizar la nota.
app.put("/ordenes/:id/platillos", async (req, res) => {
    try {
        const { id } = req.params;
        const { platillos, nota } = req.body;

        if (!Array.isArray(platillos) || platillos.length === 0) {
            return res.status(400).json({
                mensaje: "Debes enviar al menos un platillo para agregar"
            });
        }

        const ordenEncontrada = await orden.findById(id);
        if (!ordenEncontrada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }
        if (ordenEncontrada.pagada) {
            return res.status(400).json({
                mensaje: "No se pueden agregar platillos a una orden ya pagada"
            });
        }

        const idsMenu = platillos.map(p => p.menu);
        const idsMenuUnicos = [...new Set(idsMenu)];
        const platillosMenu = await menues.find({ _id: { $in: idsMenuUnicos } });

        if (platillosMenu.length !== idsMenuUnicos.length) {
            return res.status(400).json({
                mensaje: "Uno o más platillos del menú no existen"
            });
        }

        const nuevosPlatillos = platillos.map(p => {
            const encontrado = platillosMenu.find(m => m._id.toString() === p.menu);
            return {
                menu: encontrado._id,
                nombre: encontrado.nombre,
                precio: encontrado.precio,
                estado: "proceso"
            };
        });

        ordenEncontrada.platillos.push(...nuevosPlatillos);
        ordenEncontrada.total = ordenEncontrada.platillos.reduce((suma, p) => suma + p.precio, 0);
        if (nota !== undefined) ordenEncontrada.nota = nota;

        await ordenEncontrada.save();

        res.json({
            mensaje: "Platillos agregados y enviados a cocina",
            orden: ordenEncontrada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al agregar platillos a la orden",
            error: error
        });
    }
});

// Marcar un platillo como entregado en mesa (lo usa el mesero cuando ya lo llevó)
app.put("/ordenes/:id/platillos/:platilloId/entregar", async (req, res) => {
    try {
        const { id, platilloId } = req.params;

        const ordenEncontrada = await orden.findById(id);
        if (!ordenEncontrada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }

        const platillo = ordenEncontrada.platillos.id(platilloId);
        if (!platillo) {
            return res.status(404).json({
                mensaje: "Platillo no encontrado dentro de la orden"
            });
        }

        if (platillo.estado !== "ventanilla") {
            return res.status(400).json({
                mensaje: "El platillo aún no está listo en ventanilla"
            });
        }

        platillo.entregado = true;
        await ordenEncontrada.save();

        res.json({
            mensaje: "Platillo marcado como entregado",
            orden: ordenEncontrada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al marcar el platillo como entregado",
            error: error
        });
    }
});

// Marcar una orden como pagada -> además genera su movimiento de caja tipo "venta"
app.put("/ordenes/:id/pagar", async (req, res) => {
    try {
        const id = req.params.id;
        const { cajero } = req.body;

        const ordenEncontrada = await orden.findById(id);
        if (!ordenEncontrada) {
            return res.status(404).json({
                mensaje: "Orden no encontrada"
            });
        }

        if (ordenEncontrada.pagada) {
            return res.status(400).json({
                mensaje: "Esta orden ya fue pagada"
            });
        }

        ordenEncontrada.pagada = true;
        await ordenEncontrada.save();

        await new movimientoCaja({
            tipo: "venta",
            monto: ordenEncontrada.total,
            cajero,
            orden: ordenEncontrada._id,
            descripcion: `Cobro de orden #${ordenEncontrada._id}`
        }).save();

        res.json({
            mensaje: "Orden pagada exitosamente",
            orden: ordenEncontrada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al pagar la orden",
            error: error
        });
    }
});

// Eliminar una orden (por si se canceló por error, ej. capturada en la mesa equivocada)
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


// -----------------RUTAS PARA LA COLECCIÓN MOVIMIENTOS DE CAJA-----------------
// Obtener todos los movimientos de caja
app.get("/movimientos-caja", async (req, res) => {
    try {
        const movimientos = await movimientoCaja.find()
            .populate("cajero")
            .sort({ createdAt: -1 });
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los movimientos de caja",
            error: error
        });
    }
});

// Estado actual de la caja: se calcula a partir del último "apertura" registrado
// y todo lo que pasó después (ventas, entradas, salidas). Si el último movimiento
// es un "cierre", la caja está cerrada.
app.get("/caja/estado", async (req, res) => {
    try {
        const ultimoMovimiento = await movimientoCaja.findOne().sort({ createdAt: -1 });

        if (!ultimoMovimiento || ultimoMovimiento.tipo === "cierre") {
            return res.json({ abierta: false });
        }

        const ultimaApertura = await movimientoCaja.findOne({ tipo: "apertura" })
            .sort({ createdAt: -1 });

        if (!ultimaApertura) {
            return res.json({ abierta: false });
        }

        const movimientosTurno = await movimientoCaja.find({
            createdAt: { $gte: ultimaApertura.createdAt }
        }).populate("cajero");

        const base = ultimaApertura.monto;
        const ventas = movimientosTurno.filter(m => m.tipo === "venta").reduce((s, m) => s + m.monto, 0);
        const entradas = movimientosTurno.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.monto, 0);
        const salidas = movimientosTurno.filter(m => m.tipo === "salida").reduce((s, m) => s + m.monto, 0);

        res.json({
            abierta: true,
            cajero: ultimaApertura.cajero,
            base,
            ventas,
            entradas,
            salidas,
            efectivoEnCaja: base + ventas + entradas - salidas,
            desde: ultimaApertura.createdAt
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al calcular el estado de la caja",
            error: error
        });
    }
});

// Registrar un movimiento de caja (apertura, cierre, entrada o salida manual)
// Las ventas ("venta") no se crean aquí directamente, se generan solas al pagar una orden.
app.post("/movimientos-caja", async (req, res) => {
    try {
        const { tipo, monto, cajero, descripcion } = req.body;

        if (!tipo || monto == null) {
            return res.status(400).json({
                mensaje: "Faltan datos del movimiento (tipo y monto son obligatorios)"
            });
        }

        if (!["apertura", "cierre", "entrada", "salida"].includes(tipo)) {
            return res.status(400).json({
                mensaje: "Tipo de movimiento inválido para registro manual"
            });
        }

        const nuevoMovimiento = new movimientoCaja({
            tipo, monto, cajero, descripcion
        });

        await nuevoMovimiento.save();
        res.status(201).json({
            mensaje: "Movimiento de caja registrado correctamente",
            movimiento: nuevoMovimiento
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al registrar el movimiento de caja",
            error: error
        });
    }
});


// -----------------RUTAS PARA LA COLECCIÓN USUARIOS-----------------
// Obtener todos los usuarios (sin exponer el passwordHash)
app.get("/usuarios", async (req, res) => {
    try {
        const usuarios = await usuario.find().select("-passwordHash");
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
        const usuarioEncontrado = await usuario.findById(id).select("-passwordHash");
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
        const { usuario: nombreUsuario, password, nombre, rol } = req.body;

        if (!nombreUsuario || !password || !nombre || !rol) {
            return res.status(400).json({
                mensaje: "Faltan datos del usuario (usuario, password, nombre y rol son obligatorios)"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const nuevoUsuario = new usuario({
            usuario: nombreUsuario,
            passwordHash,
            nombre,
            rol
        });

        await nuevoUsuario.save();
        res.status(201).json({
            mensaje: "Usuario creado correctamente",
            usuario: {
                id: nuevoUsuario._id,
                usuario: nuevoUsuario.usuario,
                nombre: nuevoUsuario.nombre,
                rol: nuevoUsuario.rol,
                activo: nuevoUsuario.activo
            }
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el usuario",
            error: error
        });
    }
});

// Actualizar un usuario existente (nombre, rol, activo y opcionalmente password)
app.put("/usuarios/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, rol, activo, password } = req.body;

        const datosActualizados = { nombre, rol, activo };

        if (password) {
            datosActualizados.passwordHash = await bcrypt.hash(password, 10);
        }

        const usuarioActualizado = await usuario
            .findByIdAndUpdate(id, datosActualizados, { new: true })
            .select("-passwordHash");

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

// Eliminar un usuario
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


// -----------------RUTA DE LOGIN-----------------
app.post("/login", async (req, res) => {
    try {
        const { usuario: nombreUsuario, password } = req.body;

        if (!nombreUsuario || !password) {
            return res.status(400).json({
                mensaje: "Usuario y contraseña son obligatorios"
            });
        }

        const usuarioEncontrado = await usuario.findOne({
            usuario: nombreUsuario.trim().toLowerCase()
        });

        if (!usuarioEncontrado || !usuarioEncontrado.activo) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const passwordValida = await bcrypt.compare(password, usuarioEncontrado.passwordHash);

        if (!passwordValida) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        res.json({
            mensaje: "Inicio de sesión exitoso",
            usuario: {
                id: usuarioEncontrado._id,
                usuario: usuarioEncontrado.usuario,
                nombre: usuarioEncontrado.nombre,
                rol: usuarioEncontrado.rol
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al iniciar sesión",
            error: error
        });
    }
});