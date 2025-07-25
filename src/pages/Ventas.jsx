import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { formatCurrency } from "../utils/formatCurrency";
import ModalFactura from "../components/ModalFactura";

// --- Formatea números con puntos de miles ---
function formatNumberWithDots(value) {
  let clean = String(value).replace(/\D/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- MODAL PARA AGREGAR PRODUCTOS ---
function ModalAgregarProducto({ visible, onClose, onAgregar, productos, productosVenta }) {
  const [productoQuery, setProductoQuery] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState("");
  const [observacion, setObservacion] = useState("");
  const [errorStock, setErrorStock] = useState("");

  const productoMatches = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(productoQuery.toLowerCase()) ||
      (p.codigo || "").toLowerCase().includes(productoQuery.toLowerCase())
  );

  useEffect(() => {
    setProductoQuery("");
    setProductoSeleccionado(null);
    setCantidad(1);
    setPrecio("");
    setObservacion("");
    setErrorStock("");
  }, [visible]);

  useEffect(() => {
    if (productoSeleccionado) {
      let raw =
        typeof productoSeleccionado.precio === "string"
          ? Number(productoSeleccionado.precio.replace(/[.,]/g, ""))
          : Number(productoSeleccionado.precio);
      setPrecio(raw > 0 ? String(raw) : "");
    }
  }, [productoSeleccionado]);

  const handleAgregar = () => {
    if (!productoSeleccionado) return;

    const stockDisponible = Number(productoSeleccionado.stock || 0);
    const enCarrito = productosVenta
      .filter(p => p.id === productoSeleccionado.id)
      .reduce((acc, p) => acc + Number(p.cantidad), 0);

    if (Number(cantidad) + enCarrito > stockDisponible) {
      setErrorStock(
        `No hay suficiente stock para "${productoSeleccionado.nombre}". Stock disponible: ${stockDisponible - enCarrito}`
      );
      return;
    }

    setErrorStock("");
    onAgregar({
      ...productoSeleccionado,
      precio: Number(precio),
      cantidad: Number(cantidad),
      subtotal: Number(precio) * Number(cantidad),
      observacion,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed z-40 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-blue-700">Agregar Producto</h3>
        <div className="relative mb-3">
          <input
            className="input"
            placeholder="Buscar por nombre o código"
            value={productoQuery}
            onChange={(e) => {
              setProductoQuery(e.target.value);
              setProductoSeleccionado(null);
            }}
            autoFocus
          />
          {productoQuery && !productoSeleccionado && (
            <ul className="absolute left-0 right-0 bg-white z-50 border rounded shadow max-h-40 overflow-auto">
              {productoMatches.length > 0 ? (
                productoMatches.map((p) => (
                  <li
                    key={p.id}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => {
                      setProductoSeleccionado(p);
                      setProductoQuery(p.nombre);
                    }}
                  >
                    {p.nombre} <span className="text-gray-400 text-xs">({p.codigo})</span>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-gray-400">Sin coincidencias</li>
              )}
            </ul>
          )}
        </div>
        <div className="mb-3">
          <input
            className="input"
            type="number"
            min={1}
            placeholder="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={!productoSeleccionado}
          />
        </div>
        <div className="mb-3">
          <input
            className="input"
            placeholder="Precio"
            inputMode="numeric"
            value={precio}
            onChange={(e) => {
              const clean = e.target.value.replace(/[.,]/g, "").replace(/\D/g, "");
              setPrecio(clean);
            }}
            disabled={!productoSeleccionado}
          />
          {precio && (
            <div className="text-xs text-gray-500 mt-1">
              Precio: <span className="font-bold">{formatCurrency(precio)}</span>
            </div>
          )}
        </div>
        <div className="mb-3">
          <textarea
            className="input"
            placeholder="Observación (opcional, ej: imperfecto, rayón, etc.)"
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            rows={2}
            disabled={!productoSeleccionado}
          />
        </div>
        {productoSeleccionado && (
          <div className="mb-3 text-gray-700">
            <div>
              <span className="font-semibold">{productoSeleccionado.nombre}</span>
              <span className="ml-2 text-gray-400 text-xs">({productoSeleccionado.codigo})</span>
            </div>
            <div>
              Subtotal:{" "}
              <span className="font-bold">
                {formatCurrency(precio)} x {cantidad} = {formatCurrency(Number(precio) * Number(cantidad))}
              </span>
            </div>
          </div>
        )}
        {errorStock && (
          <div className="mb-3 text-red-600 font-semibold">{errorStock}</div>
        )}
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            disabled={!productoSeleccionado || !cantidad || !precio}
            onClick={handleAgregar}
          >
            Agregar
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL DE VENTA FINALIZADA ---
function ModalVentaFinalizada({ visible, onClose, onImprimir }) {
  if (!visible) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in text-center">
        <div className="text-green-600 text-4xl mb-4">✔️</div>
        <h3 className="text-2xl font-bold mb-2">¡Venta finalizada!</h3>
        <p className="mb-6">La venta se registró correctamente.</p>
        <div className="flex gap-2 justify-center">
          <button className="btn-primary" onClick={onImprimir}>
            Imprimir factura
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL FINALIZAR VENTA ---
function ModalFinalizarVenta({ visible, onClose, productosVenta, cliente, onFinalizarVenta }) {
  const [metodo, setMetodo] = useState("efectivo");
  const [recibido, setRecibido] = useState("");
  const [msg, setMsg] = useState("");
  const total = productosVenta.reduce((a, p) => a + p.subtotal, 0);
  const recibidoNumero = Number(recibido.replace(/\./g, ""));
  const cambio = metodo === "efectivo" && recibido ? recibidoNumero - total : 0;

  useEffect(() => {
    setMetodo("efectivo");
    setRecibido("");
    setMsg("");
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed z-40 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-blue-700">Finalizar Venta</h3>
        <div className="mb-4">
          <div className="font-semibold mb-1">Productos:</div>
          <ul className="mb-2">
            {productosVenta.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {p.nombre} {p.codigo && <span className="text-gray-400 text-xs">({p.codigo})</span>} x {p.cantidad}
                  {p.observacion && (
                    <span className="block text-xs text-yellow-700 italic">Obs: {p.observacion}</span>
                  )}
                </span>
                <span>
                  {formatCurrency(p.precio)} x {p.cantidad} ={" "}
                  <span className="font-bold">{formatCurrency(p.subtotal)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="font-bold text-lg mt-2 text-right text-blue-800">
            Total: {formatCurrency(total)}
          </div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1">Método de pago:</div>
          <div className="flex gap-2">
            <button
              className={`btn-secondary flex-1 ${metodo === "efectivo" ? "ring-2 ring-blue-400" : ""}`}
              onClick={() => setMetodo("efectivo")}
              type="button"
            >
              Efectivo
            </button>
            <button
              className={`btn-secondary flex-1 ${metodo === "transferencia" ? "ring-2 ring-blue-400" : ""}`}
              onClick={() => setMetodo("transferencia")}
              type="button"
            >
              Transferencia
            </button>
          </div>
        </div>
        {metodo === "efectivo" && (
          <div className="mb-4">
            <div className="font-semibold mb-1">Dinero recibido:</div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              min={total}
              placeholder="Ingresa el monto recibido"
              value={recibido}
              onChange={(e) => {
                const val = formatNumberWithDots(e.target.value);
                setRecibido(val);
              }}
            />
            {recibido !== "" && (
              <div className="mt-2 text-blue-700">
                {recibidoNumero < total ? (
                  <span>⚠️ El monto recibido es menor al total</span>
                ) : (
                  <span>
                    Cambio a devolver:{" "}
                    <span className="font-bold">
                      {formatCurrency(cambio)}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {msg && <div className="text-red-600 text-sm mb-2">{msg}</div>}
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            onClick={() => {
              if (metodo === "efectivo" && (recibido === "" || recibidoNumero < total)) {
                setMsg("El monto recibido debe ser igual o mayor al total.");
                return;
              }
              onFinalizarVenta({
                cliente: cliente || "N/A",
                productos: productosVenta,
                total,
                pago: {
                  metodo,
                  recibido: metodo === "efectivo" ? recibidoNumero : total,
                  cambio: metodo === "efectivo" ? cambio : 0,
                },
              });
            }}
          >
            Confirmar venta
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- FUNCION PARA SABER SI UNA FECHA ES DE HOY ---
function esHoy(ts) {
  if (!ts || typeof ts.toDate !== "function") return false;
  const fecha = ts.toDate();
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

// --- VENTAS PRINCIPAL ---
export default function Ventas({ onVentaFinalizada }) {
  const [ventas, setVentas] = useState([]);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [productosVenta, setProductosVenta] = useState([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [cliente, setCliente] = useState("");
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [msg, setMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [showClienteSug, setShowClienteSug] = useState(false);

  // --- Para Factura y venta finalizada ---
  const [mostrarModalFactura, setMostrarModalFactura] = useState(false);
  const [factura, setFactura] = useState(null);
  const facturaRef = useRef();
  const [mostrarModalVentaFinalizada, setMostrarModalVentaFinalizada] = useState(false);

  useEffect(() => {
    const obtenerVentas = async () => {
      const q = query(collection(db, "ventas"), orderBy("fecha", "desc"));
      const snapshot = await getDocs(q);
      setVentas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    const obtenerClientes = async () => {
      const q = query(collection(db, "clientes"), orderBy("nombre", "asc"));
      const snapshot = await getDocs(q);
      setClientes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    const obtenerProductos = async () => {
      const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
      const snapshot = await getDocs(q);
      setProductos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    obtenerVentas();
    obtenerClientes();
    obtenerProductos();
  }, []);

  const clienteMatches = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(clienteQuery.toLowerCase()) ||
      (c.correo || "").toLowerCase().includes(clienteQuery.toLowerCase())
  );

  // Ventas de hoy
  const ventasHoy = ventas.filter(v => esHoy(v.fecha));
  const cantidadVentasHoy = ventasHoy.length;
  const totalVentasHoy = ventasHoy.reduce((a, v) => a + Number(v.total), 0);

  // --- FUNCION GUARDAR FACTURA ---
  const guardarFactura = async ({ cliente, productos, total, pago, ventaId }) => {
    try {
      const nuevaFactura = {
        cliente,
        productos,
        total,
        pago,
        fecha: new Date().toISOString().slice(0, 10),
        creada: Timestamp.now(),
        ventaId: ventaId || undefined,
      };
      const docRef = await addDoc(collection(db, "facturas"), nuevaFactura);
      setFactura({ ...nuevaFactura, id: docRef.id });
      // No mostrar el modal de factura automáticamente aquí
    } catch (e) {
      setMsg("❌ Error al guardar la factura: " + e.message);
    }
  };

  // --- FINALIZAR VENTA EN SEGUNDO PLANO ---
  const finalizarVentaEnSegundoPlano = async (ventaData) => {
    try {
      // Validar que no cambió el stock mientras tanto (protección extra)
      const productosConFalta = ventaData.productos.filter(prod => {
        const productoActual = productos.find(p => p.id === prod.id);
        return Number(prod.cantidad) > Number(productoActual?.stock || 0);
      });
      if (productosConFalta.length > 0) {
        setMsg(
          "❌ No hay suficiente stock para: " +
          productosConFalta.map(p => `${p.nombre} (stock: ${productos.find(prod => prod.id === p.id)?.stock || 0})`).join(", ")
        );
        return;
      }

      // 1. Guardar la venta
      const ventaDoc = await addDoc(collection(db, "ventas"), {
        ...ventaData,
        fecha: Timestamp.now(),
      });

      // 2. Actualizar el stock de los productos vendidos
      const batchUpdates = ventaData.productos.map(async (prod) => {
        if (prod.id) {
          const productoRef = doc(db, "productos", prod.id);
          const productoActual = productos.find(p => p.id === prod.id);
          let stockActual = Number(productoActual?.stock || 0);
          let nuevaCantidad = stockActual - Number(prod.cantidad);
          if (nuevaCantidad < 0) nuevaCantidad = 0;
          await updateDoc(productoRef, { stock: nuevaCantidad });
        }
      });
      await Promise.all(batchUpdates);

      // Recargar ventas y productos (para actualizar stock en pantalla)
      const qVentas = query(collection(db, "ventas"), orderBy("fecha", "desc"));
      const snapshotVentas = await getDocs(qVentas);
      setVentas(snapshotVentas.docs.map((d) => ({ id: d.id, ...d.data() })));

      const qProductos = query(collection(db, "productos"), orderBy("nombre", "asc"));
      const snapshotProductos = await getDocs(qProductos);
      setProductos(snapshotProductos.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // --- GENERAR FACTURA AUTOMÁTICA (no mostrar modal aquí) ---
      await guardarFactura({
        cliente: ventaData.cliente,
        productos: ventaData.productos,
        total: ventaData.total,
        pago: ventaData.pago,
        ventaId: ventaDoc.id,
      });

      if (onVentaFinalizada) onVentaFinalizada();

    } catch (error) {
      setMsg("❌ Error al guardar venta");
    }
  };

  // --- FLUJO RAPIDO: FINALIZAR VENTA Y MOSTRAR MODAL DE EXITO ---
  const handleFinalizarVentaRapido = (ventaData) => {
    setMsg(""); // Limpia mensajes
    setProductosVenta([]);
    setCliente("");
    setClienteQuery("");
    setModalFinalizar(false);
    setMostrarModalVentaFinalizada(true);  // Muestra modal de éxito
    finalizarVentaEnSegundoPlano(ventaData);
  };

  // --- Acción al darle "Imprimir factura" en el modal de venta finalizada ---
  const handleImprimirFactura = () => {
    setMostrarModalVentaFinalizada(false);
    setMostrarModalFactura(true);
  };

  // --- Acción al darle "Aceptar" en el modal de venta finalizada ---
  const handleAceptarVentaFinalizada = () => {
    setMostrarModalVentaFinalizada(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in">
      {/* SECCIÓN VENTAS DE HOY */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-800 mb-1">Ventas de Hoy</h2>
            <p className="text-gray-600">Solo se muestran las ventas realizadas hoy</p>
          </div>
          <button
            className="btn-primary shadow-lg"
            onClick={() => {
              setProductosVenta([]);
              setCliente("");
              setClienteQuery("");
              setModalProducto(true);
            }}
          >
            + Nueva venta
          </button>
        </div>
        {/* Estadísticas solo de hoy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl py-6 px-6 flex items-center gap-3 shadow">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow">
              🛒
            </div>
            <div>
              <div className="text-xl font-bold">{cantidadVentasHoy}</div>
              <div className="text-gray-500">Ventas hoy</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl py-6 px-6 flex items-center gap-3 shadow">
            <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow">
              💰
            </div>
            <div>
              <div className="text-xl font-bold">
                {formatCurrency(totalVentasHoy)}
              </div>
              <div className="text-gray-500">Monto total de hoy</div>
            </div>
          </div>
        </div>
        {/* Tabla solo con ventasHoy */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Productos</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Pago</th>
                <th className="px-4 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventasHoy.map((venta) => (
                <tr key={venta.id} className="border-b hover:bg-blue-50 transition">
                  <td className="px-4 py-2">{venta.cliente}</td>
                  <td className="px-4 py-2">
                    <ul>
                      {venta.productos?.map((p, i) => (
                        <li key={i}>
                          {p.nombre} x {p.cantidad} = {formatCurrency(p.subtotal)}
                          {p.observacion && (
                            <span className="block text-xs text-yellow-700 italic">Obs: {p.observacion}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-2">{formatCurrency(venta.total)}</td>
                  <td className="px-4 py-2">
                    {venta.pago?.metodo === "efectivo"
                      ? `Efectivo (${venta.pago.recibido ? formatCurrency(venta.pago.recibido) : ""}${venta.pago.cambio ? `, cambio ${formatCurrency(venta.pago.cambio)}` : ""})`
                      : "Transferencia"}
                  </td>
                  <td className="px-4 py-2">
                    {venta.fecha?.toDate?.().toLocaleDateString?.() || ""}
                  </td>
                </tr>
              ))}
              {ventasHoy.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-400" colSpan={5}>
                    No hay ventas hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {msg && (
        <div className="text-center text-green-700 font-medium mb-8">
          {msg}
        </div>
      )}

      {/* Modal agregar productos a la venta */}
      <ModalAgregarProducto
        visible={modalProducto}
        onClose={() => setModalProducto(false)}
        onAgregar={(producto) => {
          setProductosVenta([...productosVenta, producto]);
          setModalProducto(false);
        }}
        productos={productos}
        productosVenta={productosVenta}
      />

      {/* Pantalla de carrito temporal y finalizar venta */}
      {productosVenta.length > 0 && (
        <div className="fixed z-30 bottom-0 right-0 left-0 bg-white border-t shadow-lg p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <div className="mb-2 font-semibold">Venta actual:</div>
            <ul className="mb-2 flex flex-wrap gap-2">
              {productosVenta.map((p, i) => (
                <li
                  key={i}
                  className="bg-blue-50 rounded px-3 py-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2"
                >
                  <span>
                    {p.nombre} (x{p.cantidad}) = <span className="font-bold">{formatCurrency(p.subtotal)}</span>
                  </span>
                  {p.observacion && (
                    <span className="text-xs text-yellow-700 italic">Obs: {p.observacion}</span>
                  )}
                  <button
                    className="btn-table-delete"
                    onClick={() =>
                      setProductosVenta(
                        productosVenta.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
            <div className="font-bold text-right text-lg text-blue-800">
              Total: {formatCurrency(productosVenta.reduce((a, p) => a + p.subtotal, 0))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                className="input"
                placeholder="Cliente (opcional)"
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value);
                  setCliente(e.target.value);
                  setShowClienteSug(true);
                }}
                onFocus={() => setShowClienteSug(true)}
                onBlur={() => setTimeout(() => setShowClienteSug(false), 150)}
                autoComplete="off"
              />
              {showClienteSug && clienteQuery.length > 0 && (
                <ul className="absolute left-0 right-0 bg-white z-50 border rounded shadow max-h-40 overflow-auto">
                  {clienteMatches.length > 0 ? (
                    clienteMatches.map((c) => (
                      <li
                        key={c.id}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                        onClick={() => {
                          setCliente(c.nombre);
                          setClienteQuery(c.nombre);
                          setShowClienteSug(false);
                        }}
                      >
                        {c.nombre}{" "}
                        <span className="text-gray-400 text-xs">({c.correo})</span>
                      </li>
                    ))
                  ) : (
                    <li
                      className="px-3 py-2 text-gray-400 cursor-pointer"
                      onClick={() => {
                        setCliente("N/A");
                        setClienteQuery("N/A");
                        setShowClienteSug(false);
                      }}
                    >
                      Sin coincidencias. Seleccionar "N/A".
                    </li>
                  )}
                </ul>
              )}
            </div>
            <button
              className="btn-secondary"
              onClick={() => setModalProducto(true)}
            >
              + Agregar otro producto
            </button>
            <button
              className="btn-primary"
              onClick={() => setModalFinalizar(true)}
            >
              Finalizar venta
            </button>
  
      {/* --- BOTÓN CANCELAR VENTA --- */}
      <button
        className="btn-danger"
        onClick={() => {
          setProductosVenta([]);
          setCliente("");
          setClienteQuery("");
        }}
      >
        Cancelar venta
      </button>
          </div>
        </div>
      )}

      <ModalFinalizarVenta
        visible={modalFinalizar}
        onClose={() => setModalFinalizar(false)}
        productosVenta={productosVenta}
        cliente={cliente}
        onFinalizarVenta={handleFinalizarVentaRapido}
      />

      {/* --- MODAL DE VENTA FINALIZADA --- */}
      <ModalVentaFinalizada
        visible={mostrarModalVentaFinalizada}
        onClose={handleAceptarVentaFinalizada}
        onImprimir={handleImprimirFactura}
      />

      <ModalFactura
        visible={mostrarModalFactura}
        factura={factura}
        onImprimir={() => window.print()}
        onCerrar={() => setMostrarModalFactura(false)}
        ref={facturaRef}
      />
    </div>
  );
}