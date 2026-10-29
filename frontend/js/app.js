
const API_URL = "";

const $ = (selector) => document.querySelector(selector);

let clientes = [];
let productos = [];
let pedidos = [];

const titulos = {
    inicio: "Panel principal",
    clientes: "Gestión de clientes",
    productos: "Gestión de productos",
    pedidos: "Gestión de pedidos"
};

// CONSUMIR API

async function solicitar(endpoint, opciones = {}) {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...opciones.headers
        }
    });

    const texto = await respuesta.text();
    let datos = null;

    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        datos = texto;
    }

    if (!respuesta.ok) {
        let mensaje = "Ocurrió un error en la solicitud.";

        if (typeof datos?.detail === "string") {
            mensaje = datos.detail;
        } else if (Array.isArray(datos?.detail)) {
            mensaje = datos.detail.map(error => error.msg).join(", ");
        } else if (typeof datos === "string" && datos) {
            mensaje = datos;
        }

        throw new Error(mensaje);
    }

    return datos;
}

function obtenerLista(datos) {
    if (Array.isArray(datos)) return datos;

    if (Array.isArray(datos?.items)) return datos.items;

    if (Array.isArray(datos?.resultados)) return datos.resultados;

    if (Array.isArray(datos?.data)) return datos.data;

    return [];
}

// SEGURIDAD Y FORMATO

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function formatoMoneda(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 2
    }).format(Number(valor) || 0);
}

// NOTIFICACIONES

let temporizadorNotificacion;

function notificar(mensaje, tipo = "success") {
    const notificacion = $("#notificacion");

    notificacion.textContent = mensaje;
    notificacion.className = `notification show ${tipo}`;

    clearTimeout(temporizadorNotificacion);

    temporizadorNotificacion = setTimeout(() => {
        notificacion.className = "notification";
    }, 3500);
}

// NAVEGACIÓN

document.querySelectorAll(".nav-item").forEach(boton => {
    boton.addEventListener("click", () => {
        const seccion = boton.dataset.section;

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        document.querySelectorAll(".section").forEach(item => {
            item.classList.remove("active");
        });

        boton.classList.add("active");
        $(`#${seccion}`).classList.add("active");

        $("#page-title").textContent = titulos[seccion];

        cargarSeccion(seccion);
    });
});

async function cargarSeccion(seccion) {
    try {
        if (seccion === "inicio") {
            await cargarTodo();
        }

        if (seccion === "clientes") {
            await cargarClientes();
        }

        if (seccion === "productos") {
            await cargarProductos();
        }

        if (seccion === "pedidos") {
            await cargarPedidos();
        }
    } catch (error) {
        notificar(error.message, "error");
    }
}

// CONEXIÓN CON FASTAPI

async function comprobarConexion() {
    const estado = $("#api-status");

    try {
        await solicitar("/");

        estado.textContent = "Servidor conectado correctamente.";
        estado.style.color = "#059669";
    } catch {
        estado.textContent = "No se pudo conectar con FastAPI.";
        estado.style.color = "#dc2626";
    }
}

// CLIENTES

async function cargarClientes() {
    const datos = await solicitar("/clientes");

    clientes = obtenerLista(datos);

    mostrarClientes();
    actualizarEstadisticas();
    cargarSelectClientes();
}

function mostrarClientes() {
    const tabla = $("#tabla-clientes");

    if (!clientes.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No hay clientes registrados.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = clientes.map(cliente => `
        <tr>
            <td>#${escapar(cliente.id)}</td>
            <td>${escapar(cliente.nombre)}</td>
            <td>${escapar(cliente.apellido)}</td>
            <td>${escapar(cliente.correo || cliente.email)}</td>
            <td>${escapar(cliente.telefono || "No registrado")}</td>
        </tr>
    `).join("");
}

$("#btn-nuevo-cliente").addEventListener("click", () => {
    $("#form-cliente").classList.toggle("hidden");
});

$("#cancelar-cliente").addEventListener("click", () => {
    $("#form-cliente").classList.add("hidden");
    $("#formulario-cliente").reset();
});

$("#formulario-cliente").addEventListener("submit", async evento => {
    evento.preventDefault();

    const formulario = new FormData(evento.target);

    const cliente = {
        nombre: formulario.get("nombre").trim(),
        apellido: formulario.get("apellido").trim(),
        correo: formulario.get("email").trim(),
        telefono: formulario.get("telefono").trim() || null
    };

    try {
        await solicitar("/clientes", {
            method: "POST",
            body: JSON.stringify(cliente)
        });

        notificar("Cliente registrado correctamente.");

        evento.target.reset();
        $("#form-cliente").classList.add("hidden");

        await cargarClientes();
    } catch (error) {
        notificar(error.message, "error");
    }
});

// PRODUCTOS

async function cargarProductos() {
    const datos = await solicitar("/productos");

    productos = obtenerLista(datos);

    mostrarProductos();
    actualizarEstadisticas();
    cargarSelectProductos();
}

function mostrarProductos() {
    const tabla = $("#tabla-productos");

    if (!productos.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No hay productos registrados.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = productos.map(producto => `
        <tr>
            <td>#${escapar(producto.id)}</td>
            <td><strong>${escapar(producto.nombre)}</strong></td>
            <td>${escapar(producto.descripcion || "Sin descripción")}</td>
            <td>${formatoMoneda(producto.precio)}</td>
            <td>${escapar(producto.stock)}</td>
        </tr>
    `).join("");
}

$("#btn-nuevo-producto").addEventListener("click", () => {
    $("#form-producto").classList.toggle("hidden");
});

$("#cancelar-producto").addEventListener("click", () => {
    $("#form-producto").classList.add("hidden");
    $("#formulario-producto").reset();
});

$("#formulario-producto").addEventListener("submit", async evento => {
    evento.preventDefault();

    const formulario = new FormData(evento.target);

    const producto = {
        nombre: formulario.get("nombre").trim(),
        descripcion: formulario.get("descripcion").trim() || null,
        precio: Number(formulario.get("precio")),
        stock: Number(formulario.get("stock"))
    };

    try {
        await solicitar("/productos", {
            method: "POST",
            body: JSON.stringify(producto)
        });

        notificar("Producto registrado correctamente.");

        evento.target.reset();
        $("#form-producto").classList.add("hidden");

        await cargarProductos();
    } catch (error) {
        notificar(error.message, "error");
    }
});

// SELECTORES PARA PEDIDOS

function cargarSelectClientes() {
    const selector = $("#cliente-pedido");

    selector.innerHTML = `
        <option value="">Selecciona un cliente</option>
        ${clientes.map(cliente => `
            <option value="${escapar(cliente.id)}">
                ${escapar(cliente.nombre)} ${escapar(cliente.apellido)}
            </option>
        `).join("")}
    `;
}

function opcionesProductos() {
    return `
        <option value="">Selecciona un producto</option>
        ${productos.map(producto => `
            <option value="${escapar(producto.id)}">
                ${escapar(producto.nombre)} - ${formatoMoneda(producto.precio)}
                (Stock: ${escapar(producto.stock)})
            </option>
        `).join("")}
    `;
}

function cargarSelectProductos() {
    document.querySelectorAll(".producto-pedido").forEach(selector => {
        const valorActual = selector.value;

        selector.innerHTML = opcionesProductos();
        selector.value = valorActual;
    });
}

// PEDIDOS

async function cargarPedidos() {
    const datos = await solicitar("/pedidos");

    pedidos = obtenerLista(datos);

    mostrarPedidos();
    actualizarEstadisticas();

    // Los selectores necesitan los datos actualizados.
    if (!clientes.length) {
        await cargarClientes();
    }

    if (!productos.length) {
        await cargarProductos();
    }
}

function mostrarPedidos() {
    const tabla = $("#tabla-pedidos");

    if (!pedidos.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="3" class="empty-row">
                    No hay pedidos registrados.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = pedidos.map(pedido => {
        const nombreCliente =
            pedido.cliente_nombre ||
            pedido.nombre_cliente ||
            pedido.cliente ||
            `Cliente #${pedido.cliente_id}`;

        return `
            <tr>
                <td><strong>#${escapar(pedido.id)}</strong></td>
                <td>${escapar(
                    typeof nombreCliente === "object"
                        ? nombreCliente.nombre || pedido.cliente_id
                        : nombreCliente
                )}</td>
                <td>${formatoMoneda(pedido.total)}</td>
            </tr>
        `;
    }).join("");
}

$("#btn-nuevo-pedido").addEventListener("click", async () => {
    try {
        await cargarClientes();
        await cargarProductos();

        if (!clientes.length || !productos.length) {
            notificar("Necesitas al menos un cliente y un producto.", "error");
            return;
        }

        $("#form-pedido").classList.remove("hidden");
        cargarSelectClientes();
        cargarSelectProductos();
    } catch (error) {
        notificar(error.message, "error");
    }
});

$("#cancelar-pedido").addEventListener("click", () => {
    $("#form-pedido").classList.add("hidden");
    $("#formulario-pedido").reset();

    $("#pedido-items").innerHTML = `
        <div class="pedido-item">
            <select class="producto-pedido" required>
                ${opcionesProductos()}
            </select>
            <input class="cantidad-pedido" type="number" min="1" value="1" required>
        </div>
    `;
});

$("#agregar-item").addEventListener("click", () => {
    const contenedor = $("#pedido-items");

    const nuevoItem = document.createElement("div");
    nuevoItem.className = "pedido-item";

    nuevoItem.innerHTML = `
        <select class="producto-pedido" required>
            ${opcionesProductos()}
        </select>
        <input class="cantidad-pedido" type="number" min="1" value="1" required>
    `;

    contenedor.appendChild(nuevoItem);
});

$("#formulario-pedido").addEventListener("submit", async evento => {
    evento.preventDefault();

    const clienteId = Number($("#cliente-pedido").value);

    const items = Array.from(
        document.querySelectorAll(".pedido-item")
    ).map(item => ({
        producto_id: Number(item.querySelector(".producto-pedido").value),
        cantidad: Number(item.querySelector(".cantidad-pedido").value)
    }));

    if (items.some(item =>
        !Number.isInteger(item.producto_id) ||
        !Number.isInteger(item.cantidad) ||
        item.cantidad < 1
    )) {
        notificar("Verifica los productos y sus cantidades.", "error");
        return;
    }

    const pedido = {
        cliente_id: clienteId,
        items: items
    };

    try {
        await solicitar("/pedidos", {
            method: "POST",
            body: JSON.stringify(pedido)
        });

        notificar("Pedido creado correctamente.");

        evento.target.reset();
        $("#form-pedido").classList.add("hidden");

        $("#pedido-items").innerHTML = `
            <div class="pedido-item">
                <select class="producto-pedido" required>
                    ${opcionesProductos()}
                </select>
                <input class="cantidad-pedido" type="number" min="1" value="1" required>
            </div>
        `;

        await cargarPedidos();
        await cargarProductos();
    } catch (error) {
        notificar(error.message, "error");
    }
});

// ESTADÍSTICAS

function actualizarEstadisticas() {
    $("#total-clientes").textContent = clientes.length;
    $("#total-productos").textContent = productos.length;
    $("#total-pedidos").textContent = pedidos.length;
}

// CARGA GENERAL

async function cargarTodo() {
    await Promise.all([
        cargarClientes(),
        cargarProductos(),
        cargarPedidos()
    ]);
}

// INICIAR APLICACIÓN

async function iniciarAplicacion() {
    await comprobarConexion();

    try {
        await cargarTodo();
    } catch (error) {
        notificar(error.message, "error");
    }
}

document.addEventListener("DOMContentLoaded", iniciarAplicacion);
