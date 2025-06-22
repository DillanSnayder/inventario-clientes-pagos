import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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

export default function Estadisticas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const obtenerVentas = async () => {
      const q = query(collection(db, "ventas"), orderBy("fecha", "desc"));
      const snapshot = await getDocs(q);
      setVentas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    obtenerVentas();
  }, []);

  // Estadísticas principales
  const totalHistorico = ventas.reduce((a, v) => a + Number(v.total), 0);
  const cantidadTotal = ventas.length;

  // Ventas de hoy
  const ventasHoy = ventas.filter(v => esHoy(v.fecha));
  const totalHoy = ventasHoy.reduce((a, v) => a + Number(v.total), 0);

  // Ventas de esta semana
  const ventasSemana = ventas.filter(v => esEstaSemana(v.fecha));
  const totalSemana = ventasSemana.reduce((a, v) => a + Number(v.total), 0);

  // Top 5 clientes por cantidad de compras
  const clientesConteo = {};
  ventas.forEach(v => {
    const cliente = v.cliente || "N/A";
    clientesConteo[cliente] = (clientesConteo[cliente] || 0) + 1;
  });
  const topClientes = Object.entries(clientesConteo)
    .sort((a,b) => b[1] - a[1])
    .slice(0,5);

  // Top 5 productos más vendidos
  const productosConteo = {};
  ventas.forEach(v => {
    if(Array.isArray(v.productos)) {
      v.productos.forEach(p => {
        productosConteo[p.nombre] = (productosConteo[p.nombre] || 0) + Number(p.cantidad);
      });
    }
  });
  const topProductos = Object.entries(productosConteo)
    .sort((a,b) => b[1] - a[1])
    .slice(0,5);

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-green-900 mb-8">📊 Estadísticas de Ventas</h2>
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

      {/* Top clientes */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Top 5 clientes</h3>
        <ol className="list-decimal ml-6">
          {topClientes.map(([cliente, cantidad]) => (
            <li key={cliente} className="mb-1">{cliente}: <span className="font-semibold">{cantidad} compra{cantidad>1?"s":""}</span></li>
          ))}
        </ol>
      </div>

      {/* Top productos */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Top 5 productos más vendidos</h3>
        <ol className="list-decimal ml-6">
          {topProductos.map(([nombre, cantidad]) => (
            <li key={nombre} className="mb-1">{nombre}: <span className="font-semibold">{cantidad} unidad{cantidad>1?"es":""}</span></li>
          ))}
        </ol>
      </div>

      {/* Tabla de ventas históricas (opcional) */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow overflow-x-auto">
        <h3 className="text-xl font-bold text-blue-800 mb-4">Histórico de ventas</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Productos</th>
              <th className="px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
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
              </tr>
            ))}
            {ventas.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-center text-gray-400" colSpan={4}>
                  No hay ventas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}