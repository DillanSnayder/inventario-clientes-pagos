import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { formatCurrency } from "../utils/formatCurrency";

// Función para saber si una fecha es de hoy
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

// Función para saber si una fecha es de esta semana
function esEstaSemana(ts) {
  if (!ts || typeof ts.toDate !== "function") return false;
  const fecha = ts.toDate();
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  inicioSemana.setHours(0,0,0,0);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23,59,59,999);
  return fecha >= inicioSemana && fecha <= finSemana;
}

// --- Formatea números con puntos de miles ---
function formatNumberWithDots(value) {
  let clean = String(value).replace(/\D/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function Estadisticas() {
  const [ventas, setVentas] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("");
  const [msg, setMsg] = useState("");
  const [modalEliminar, setModalEliminar] = useState(false);

  useEffect(() => {
    const obtenerVentas = async () => {
      const q = query(collection(db, "ventas"), orderBy("fecha", "desc"));
      const snapshot = await getDocs(q);
      setVentas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    obtenerVentas();
  }, []);

  // --- Filtro avanzado ---
  const ventasFiltradas = ventas.filter((v) => {
    // Filtro por fecha
    let pasa = true;
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde);
      const fechaVenta = v.fecha?.toDate?.() ?? new Date(v.fecha);
      if (fechaVenta < desde) pasa = false;
    }
    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta + "T23:59:59");
      const fechaVenta = v.fecha?.toDate?.() ?? new Date(v.fecha);
      if (fechaVenta > hasta) pasa = false;
    }
    // Filtro por cliente
    if (filtroCliente && !v.cliente?.toLowerCase().includes(filtroCliente.toLowerCase())) pasa = false;
    // Filtro por producto
    if (filtroProducto) {
      if (!Array.isArray(v.productos) || !v.productos.some(p => p.nombre?.toLowerCase().includes(filtroProducto.toLowerCase()))) {
        pasa = false;
      }
    }
    return pasa;
  });

  // Estadísticas principales
  const totalHistorico = ventas.reduce((a, v) => a + Number(v.total), 0);
  const cantidadTotal = ventas.length;
  const totalFiltrado = ventasFiltradas.reduce((a, v) => a + Number(v.total), 0);

  // Ventas de hoy
  const ventasHoy = ventas.filter(v => esHoy(v.fecha));
  const totalHoy = ventasHoy.reduce((a, v) => a + Number(v.total), 0);

  // Ventas de esta semana
  const ventasSemana = ventas.filter(v => esEstaSemana(v.fecha));
  const totalSemana = ventasSemana.reduce((a, v) => a + Number(v.total), 0);

  // Top 5 clientes por cantidad de compras (en filtro)
  const clientesConteo = {};
  ventasFiltradas.forEach(v => {
    const cliente = v.cliente || "N/A";
    clientesConteo[cliente] = (clientesConteo[cliente] || 0) + 1;
  });
  const topClientes = Object.entries(clientesConteo)
    .sort((a,b) => b[1] - a[1])
    .slice(0,5);

  // Top 5 productos más vendidos (en filtro)
  const productosConteo = {};
  ventasFiltradas.forEach(v => {
    if(Array.isArray(v.productos)) {
      v.productos.forEach(p => {
        productosConteo[p.nombre] = (productosConteo[p.nombre] || 0) + Number(p.cantidad);
      });
    }
  });
  const topProductos = Object.entries(productosConteo)
    .sort((a,b) => b[1] - a[1])
    .slice(0,5);

  // Eliminar ventas filtradas
  async function eliminarVentasFiltradas() {
    setModalEliminar(false);
    for (const v of ventasFiltradas) {
      await deleteDoc(doc(db, "ventas", v.id));
    }
    setVentas(ventas.filter(v => !ventasFiltradas.some(fv => fv.id === v.id)));
    setMsg(`Ventas eliminadas correctamente.`);
  }

  // Exportar a CSV
  function exportarCSV() {
    if (ventasFiltradas.length === 0) return;
    const encabezados = ['Fecha','Cliente','Productos','Total'];
    const filas = ventasFiltradas.map(v => [
      v.fecha?.toDate?.().toLocaleDateString?.() || "",
      `"${v.cliente || ""}"`,
      `"${(v.productos || []).map(p => p.nombre + " x" + p.cantidad).join(", ")}"`,
      formatCurrency(v.total)
    ]);
    const csv = [encabezados, ...filas].map(fila => fila.join(",")).join("\n");
    const blob = new Blob([csv], {type: "text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ventas.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-green-900 mb-8">📊 Estadísticas de Ventas</h2>
      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-gray-600 text-sm">Desde</label>
          <input
            type="date"
            className="input"
            value={filtroFechaDesde}
            onChange={e => setFiltroFechaDesde(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm">Hasta</label>
          <input
            type="date"
            className="input"
            value={filtroFechaHasta}
            onChange={e => setFiltroFechaHasta(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm">Cliente</label>
          <input
            type="text"
            className="input"
            value={filtroCliente}
            placeholder="Nombre cliente"
            onChange={e => setFiltroCliente(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm">Producto</label>
          <input
            type="text"
            className="input"
            value={filtroProducto}
            placeholder="Nombre producto"
            onChange={e => setFiltroProducto(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={() => {
          setFiltroFechaDesde("");
          setFiltroFechaHasta("");
          setFiltroCliente("");
          setFiltroProducto("");
        }}>Limpiar filtros</button>
        <button className="btn-primary" onClick={exportarCSV} disabled={ventasFiltradas.length === 0}>Exportar CSV</button>
        <button className="btn-danger" onClick={() => setModalEliminar(true)} disabled={ventasFiltradas.length === 0}>
          Eliminar ventas filtradas
        </button>
      </div>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-50 rounded-xl p-6 flex items-center gap-4 shadow">
          <div className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow">
            🛒
          </div>
          <div>
            <div className="text-lg font-bold">{cantidadTotal}</div>
            <div className="text-gray-500">Ventas totales</div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 flex items-center gap-4 shadow">
          <div className="bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow">
            💰
          </div>
          <div>
            <div className="text-lg font-bold">{formatCurrency(totalHistorico)}</div>
            <div className="text-gray-500">Monto total</div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-6 flex items-center gap-4 shadow">
          <div className="bg-yellow-500 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow">
            📅
          </div>
          <div>
            <div className="text-lg font-bold">{ventasHoy.length}</div>
            <div className="text-gray-500">Ventas hoy</div>
            <div className="font-bold text-blue-700">{formatCurrency(totalHoy)}</div>
          </div>
        </div>
      </div>

      {/* Esta semana */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Semana actual</h3>
        <div className="flex gap-8">
          <div>
            <span className="font-semibold">{ventasSemana.length}</span>{" "}
            ventas esta semana
          </div>
          <div>
            Total: <span className="font-semibold">{formatCurrency(totalSemana)}</span>
          </div>
        </div>
      </div>

      {/* Filtro info */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 shadow flex flex-wrap gap-8 items-center">
        <div>
          <span className="text-blue-800 font-bold">{ventasFiltradas.length}</span> ventas filtradas
          <span className="ml-4">Total: <span className="font-bold">{formatCurrency(totalFiltrado)}</span></span>
        </div>
        {msg && (<div className="text-green-700 font-medium">{msg}</div>)}
      </div>

      {/* Top clientes */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Top 5 clientes (en filtro)</h3>
        <ol className="list-decimal ml-6">
          {topClientes.map(([cliente, cantidad]) => (
            <li key={cliente} className="mb-1">{cliente}: <span className="font-semibold">{cantidad} compra{cantidad>1?"s":""}</span></li>
          ))}
        </ol>
      </div>

      {/* Top productos */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Top 5 productos más vendidos (en filtro)</h3>
        <ol className="list-decimal ml-6">
          {topProductos.map(([nombre, cantidad]) => (
            <li key={nombre} className="mb-1">{nombre}: <span className="font-semibold">{cantidad} unidad{cantidad>1?"es":""}</span></li>
          ))}
        </ol>
      </div>

      {/* Tabla de ventas filtradas */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow overflow-x-auto">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Histórico de ventas (filtradas)</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Productos</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((venta) => (
              <tr key={venta.id} className="border-b hover:bg-blue-50 transition">
                <td className="px-4 py-2">
                  {venta.fecha?.toDate?.().toLocaleDateString?.() || ""}
                </td>
                <td className="px-4 py-2">{venta.cliente}</td>
                <td className="px-4 py-2">
                  <ul>
                    {venta.productos?.map((p, i) => (
                      <li key={i}>
                        {p.nombre} x {p.cantidad}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2">{formatCurrency(venta.total)}</td>
                <td className="px-4 py-2">
                  <button
                    className="btn-danger"
                    title="Eliminar venta"
                    onClick={async () => {
                      await deleteDoc(doc(db, "ventas", venta.id));
                      setVentas(ventas.filter(v => v.id !== venta.id));
                      setMsg("Venta eliminada.");
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {ventasFiltradas.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-center text-gray-400" colSpan={5}>
                  No hay ventas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de confirmación para eliminar todas */}
      {modalEliminar && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in text-center">
            <div className="text-red-600 text-4xl mb-4">🗑️</div>
            <h3 className="text-2xl font-bold mb-2">Eliminar ventas</h3>
            <p className="mb-4">
              ¿Estás segura que deseas eliminar <span className="font-bold">{ventasFiltradas.length}</span> ventas filtradas? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-center">
              <button className="btn-danger" onClick={eliminarVentasFiltradas}>
                Eliminar
              </button>
              <button className="btn-secondary" onClick={() => setModalEliminar(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}