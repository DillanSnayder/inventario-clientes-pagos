import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { formatCurrency } from "../utils/formatCurrency";

// Formateo de montos con puntos de miles en tiempo real
function formatInputMonto(value) {
  let clean = value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const parts = clean.split(".");
  let entero = parts[0].replace(/\./g, "");
  let decimales = parts[1] || "";
  let formatted = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decimales) formatted += "," + decimales;
  return formatted;
}
function parseMonto(value) {
  let clean = value.replace(/\./g, "").replace(/,/g, ".");
  return Number(clean) || 0;
}

export default function Finanzas() {
  const [movimientos, setMovimientos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [form, setForm] = useState({
    tipo: "ingreso",
    categoria: "",
    monto: "",
    descripcion: "",
    fecha: "",
    metodo: "Efectivo",
    referencia: "",
  });
  const [msg, setMsg] = useState("");
  const [modoIngreso, setModoIngreso] = useState("manual"); // "manual" o "ventas"
  const [ventasSeleccionadas, setVentasSeleccionadas] = useState({});
  const [seleccionTodosVentas, setSeleccionTodosVentas] = useState(false);
  const [movimientosSeleccionados, setMovimientosSeleccionados] = useState({});
  const [seleccionTodosMovimientos, setSeleccionTodosMovimientos] = useState(false);

  // Filtros y filtros temporales para usar botón 'Filtrar'
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [tempFiltroTipo, setTempFiltroTipo] = useState("");
  const [tempFiltroCategoria, setTempFiltroCategoria] = useState("");
  const [tempFiltroDesde, setTempFiltroDesde] = useState("");
  const [tempFiltroHasta, setTempFiltroHasta] = useState("");

  // Cargar movimientos y ventas
  useEffect(() => {
    async function cargar() {
      const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      setMovimientos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const qv = query(collection(db, "ventas"), orderBy("fecha", "desc"));
      const snapv = await getDocs(qv);
      setVentas(
        snapv.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          monto: Number(d.data().total),
          fecha: d.data().fecha?.toDate?.() || new Date(d.data().fecha),
        }))
      );
    }
    cargar();
  }, []);

  // Guardar nuevo movimiento manual
  async function guardar(e) {
    e.preventDefault();
    const montoNum = parseMonto(form.monto);
    if (!form.monto || isNaN(montoNum) || montoNum <= 0) {
      setMsg("Monto inválido");
      return;
    }
    const nuevo = {
      ...form,
      monto: montoNum,
      fecha: form.fecha ? new Date(form.fecha) : new Date(),
      creada: Timestamp.now(),
      origen: "manual",
    };
    const docRef = await addDoc(collection(db, "movimientos"), nuevo);
    setMovimientos([{ ...nuevo, id: docRef.id }, ...movimientos]);
    setMsg("Movimiento guardado");
    setForm({
      tipo: "ingreso",
      categoria: "",
      monto: "",
      descripcion: "",
      fecha: "",
      metodo: "Efectivo",
      referencia: "",
    });
  }

  // Filtrar ventas que ya están como ingresos
  const ventasNoIngresadas = ventas.filter(
    (v) =>
      !movimientos.some(
        (m) => m.origen === "venta" && m.ventaId === v.id
      )
  );

  // Selección masiva ventas
  useEffect(() => {
    if (seleccionTodosVentas) {
      const obj = {};
      ventasNoIngresadas.forEach(v => { obj[v.id] = true; });
      setVentasSeleccionadas(obj);
    } else if (Object.keys(ventasSeleccionadas).length > 0) {
      setVentasSeleccionadas({});
    }
    // eslint-disable-next-line
  }, [seleccionTodosVentas]);

  // Agregar ventas como ingresos
  async function agregarVentasComoIngresos() {
    let nuevos = [];
    for (const v of ventasNoIngresadas) {
      if (ventasSeleccionadas[v.id]) {
        const yaExiste = movimientos.some(
          (m) => m.origen === "venta" && m.ventaId === v.id
        );
        if (!yaExiste) {
          const mov = {
            tipo: "ingreso",
            categoria: "Venta",
            monto: Number(v.monto),
            descripcion: v.cliente
              ? `Venta a ${v.cliente}`
              : "Venta registrada",
            fecha: v.fecha,
            metodo: v.metodo || "Efectivo",
            referencia: v.id,
            origen: "venta",
            ventaId: v.id,
            creada: Timestamp.now(),
          };
          const docRef = await addDoc(collection(db, "movimientos"), mov);
          nuevos.push({ ...mov, id: docRef.id });
        }
      }
    }
    setMovimientos((arr) => [...nuevos, ...arr]);
    setMsg("Ventas añadidas como ingresos");
    setVentasSeleccionadas({});
    setSeleccionTodosVentas(false);
  }

  // Selección masiva movimientos
  useEffect(() => {
    if (seleccionTodosMovimientos) {
      const obj = {};
      movimientosFiltrados.forEach(m => { obj[m.id] = true; });
      setMovimientosSeleccionados(obj);
    } else if (Object.keys(movimientosSeleccionados).length > 0) {
      setMovimientosSeleccionados({});
    }
    // eslint-disable-next-line
  }, [seleccionTodosMovimientos]);

  // Eliminar movimientos seleccionados
  async function eliminarSeleccionados() {
    for (const id of Object.keys(movimientosSeleccionados)) {
      await deleteDoc(doc(db, "movimientos", id));
    }
    setMovimientos(movimientos.filter((m) => !movimientosSeleccionados[m.id]));
    setMsg("Registros eliminados");
    setMovimientosSeleccionados({});
    setSeleccionTodosMovimientos(false);
  }

  // Eliminar movimiento individual
  async function eliminar(id) {
    await deleteDoc(doc(db, "movimientos", id));
    setMovimientos(movimientos.filter((m) => m.id !== id));
    setMsg("Eliminado");
  }

  // Filtros: solo se aplican cuando el usuario pulsa "Filtrar"
  const movimientosFiltrados = movimientos.filter((mov) => {
    let ok = true;
    if (filtroTipo && mov.tipo !== filtroTipo) ok = false;
    if (
      filtroCategoria &&
      !mov.categoria?.toLowerCase().includes(filtroCategoria.toLowerCase())
    )
      ok = false;
    if (filtroDesde && new Date(mov.fecha) < new Date(filtroDesde)) ok = false;
    if (
      filtroHasta &&
      new Date(mov.fecha) > new Date(filtroHasta + "T23:59:59")
    )
      ok = false;
    return ok;
  });

  // Resúmenes
  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo === "ingreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo === "egreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
        💸 Ingresos y Egresos
      </h2>

      {/* Selector de origen de ingresos */}
      <div className="flex gap-4 mb-4 justify-center">
        <label>
          <input
            type="radio"
            checked={modoIngreso === "manual"}
            onChange={() => setModoIngreso("manual")}
          />{" "}
          Ingresos manuales
        </label>
        <label>
          <input
            type="radio"
            checked={modoIngreso === "ventas"}
            onChange={() => setModoIngreso("ventas")}
          />{" "}
          Ingresos = Ventas realizadas
        </label>
      </div>

      {/* Formulario manual */}
      {modoIngreso === "manual" && (
        <form
          onSubmit={guardar}
          className="bg-white p-6 rounded-xl shadow mb-8 flex flex-col gap-3"
        >
          <div className="flex gap-3">
            <select
              className="input"
              value={form.tipo}
              onChange={(e) =>
                setForm((f) => ({ ...f, tipo: e.target.value }))
              }
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
            <input
              className="input flex-1"
              placeholder="Categoría"
              value={form.categoria}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoria: e.target.value }))
              }
              required
            />
            <input
              className="input"
              placeholder="Monto"
              value={formatInputMonto(form.monto)}
              onChange={(e) => {
                let raw = e.target.value.replace(/[^0-9.,]/g, "");
                setForm((f) => ({ ...f, monto: raw }));
              }}
              required
              inputMode="decimal"
            />
          </div>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
            />
            <input
              className="input"
              type="date"
              value={form.fecha}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3">
            <select
              className="input"
              value={form.metodo}
              onChange={(e) =>
                setForm((f) => ({ ...f, metodo: e.target.value }))
              }
            >
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Otro</option>
            </select>
            <input
              className="input flex-1"
              placeholder="Referencia/Comprobante"
              value={form.referencia}
              onChange={(e) =>
                setForm((f) => ({ ...f, referencia: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn-primary mt-2">
            Guardar
          </button>
          {msg && <div className="text-green-700">{msg}</div>}
        </form>
      )}

      {/* Listar ventas para añadir como ingresos */}
      {modoIngreso === "ventas" && (
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <div className="mb-2 font-bold text-blue-800 text-center">
            Selecciona las ventas a registrar como ingresos
          </div>
          <div className="overflow-x-auto max-h-72">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-900">
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        ventasNoIngresadas.length > 0 &&
                        Object.keys(ventasSeleccionadas).length === ventasNoIngresadas.length
                      }
                      onChange={() =>
                        setSeleccionTodosVentas(
                          !(
                            ventasNoIngresadas.length > 0 &&
                            Object.keys(ventasSeleccionadas).length === ventasNoIngresadas.length
                          )
                        )
                      }
                    />
                  </th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Productos</th>
                </tr>
              </thead>
              <tbody>
                {ventasNoIngresadas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-3">
                      Todas las ventas ya están registradas como ingresos
                    </td>
                  </tr>
                )}
                {ventasNoIngresadas.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!ventasSeleccionadas[v.id]}
                        onChange={(e) =>
                          setVentasSeleccionadas((sel) => ({
                            ...sel,
                            [v.id]: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td>
                      {v.fecha ? new Date(v.fecha).toLocaleDateString() : ""}
                    </td>
                    <td>{v.cliente}</td>
                    <td>{formatCurrency(v.monto)}</td>
                    <td>
                      <ul>
                        {v.productos?.map((p, i) => (
                          <li key={i}>
                            {p.nombre} x {p.cantidad}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn-primary mt-3"
            onClick={agregarVentasComoIngresos}
            disabled={
              Object.values(ventasSeleccionadas).filter(Boolean).length === 0
            }
          >
            Registrar ingresos por ventas seleccionadas
          </button>
        </div>
      )}

      {/* Filtros con BOTÓN */}
      <div className="bg-blue-50 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end">
        <select
          className="input"
          value={tempFiltroTipo}
          onChange={e => setTempFiltroTipo(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="ingreso">Ingresos</option>
          <option value="egreso">Egresos</option>
        </select>
        <input
          className="input"
          placeholder="Categoría"
          value={tempFiltroCategoria}
          onChange={e => setTempFiltroCategoria(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={tempFiltroDesde}
          onChange={e => setTempFiltroDesde(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={tempFiltroHasta}
          onChange={e => setTempFiltroHasta(e.target.value)}
        />
        <button
          className="btn-primary"
          onClick={() => {
            setFiltroTipo(tempFiltroTipo);
            setFiltroCategoria(tempFiltroCategoria);
            setFiltroDesde(tempFiltroDesde);
            setFiltroHasta(tempFiltroHasta);
          }}
        >
          Filtrar
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setFiltroTipo("");
            setFiltroCategoria("");
            setFiltroDesde("");
            setFiltroHasta("");
            setTempFiltroTipo("");
            setTempFiltroCategoria("");
            setTempFiltroDesde("");
            setTempFiltroHasta("");
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-xl text-center">
          <div className="text-lg text-green-700 font-bold">Ingresos</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalIngresos)}
          </div>
        </div>
        <div className="bg-red-100 p-4 rounded-xl text-center">
          <div className="text-lg text-red-700 font-bold">Egresos</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalEgresos)}
          </div>
        </div>
        <div
          className={`p-4 rounded-xl text-center ${
            balance >= 0 ? "bg-blue-100" : "bg-yellow-100"
          }`}
        >
          <div className="text-lg font-bold">Balance</div>
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <input
              type="checkbox"
              checked={
                movimientosFiltrados.length > 0 &&
                Object.keys(movimientosSeleccionados).length === movimientosFiltrados.length
              }
              onChange={() =>
                setSeleccionTodosMovimientos(
                  !(movimientosFiltrados.length > 0 &&
                  Object.keys(movimientosSeleccionados).length === movimientosFiltrados.length)
                )
              }
            />{" "}
            Seleccionar todos
          </div>
          <button
            className="btn-danger"
            onClick={eliminarSeleccionados}
            disabled={
              Object.values(movimientosSeleccionados).filter(Boolean).length === 0
            }
          >
            Eliminar seleccionados
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th></th>
              <th className="px-2 py-2">Fecha</th>
              <th className="px-2 py-2">Tipo</th>
              <th className="px-2 py-2">Origen</th>
              <th className="px-2 py-2">Categoría</th>
              <th className="px-2 py-2">Descripción</th>
              <th className="px-2 py-2">Monto</th>
              <th className="px-2 py-2">Método</th>
              <th className="px-2 py-2">Referencia</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.map((mov) => (
              <tr key={mov.id} className="border-b">
                <td>
                  <input
                    type="checkbox"
                    checked={!!movimientosSeleccionados[mov.id]}
                    onChange={(e) =>
                      setMovimientosSeleccionados((sel) => ({
                        ...sel,
                        [mov.id]: e.target.checked,
                      }))
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  {mov.fecha
                    ? new Date(mov.fecha).toLocaleDateString()
                    : ""}
                </td>
                <td
                  className={`px-2 py-2 font-bold ${
                    mov.tipo === "ingreso"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {mov.tipo}
                </td>
                <td className="px-2 py-2">
                  {mov.origen === "venta" ? "Venta" : "Manual"}
                </td>
                <td className="px-2 py-2">{mov.categoria}</td>
                <td className="px-2 py-2">{mov.descripcion}</td>
                <td className="px-2 py-2 text-right">
                  {formatCurrency(mov.monto)}
                </td>
                <td className="px-2 py-2">{mov.metodo}</td>
                <td className="px-2 py-2">{mov.referencia}</td>
                <td className="px-2 py-2">
                  <button
                    className="btn-danger"
                    onClick={() => eliminar(mov.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-gray-400 py-4">
                  Sin movimientos en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}