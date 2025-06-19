// src/components/Pagos.jsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

function Pagos() {
  const [clientes, setClientes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [pagoActualId, setPagoActualId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'clientes'));
        const listaClientes = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre
        }));
        setClientes(listaClientes);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };

    const obtenerPagos = async () => {
      try {
        const q = query(collection(db, 'pagos'), orderBy('fechaPago', 'desc'));
        const snapshot = await getDocs(q);
        const listaPagos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPagos(listaPagos);
      } catch (error) {
        console.error("Error al obtener pagos:", error);
      }
    };

    obtenerClientes();
    obtenerPagos();
  }, []);

  const limpiarFormulario = () => {
    setClienteSeleccionado('');
    setMonto('');
    setMetodo('');
    setDescripcion('');
    setModoEdicion(false);
    setPagoActualId(null);
  };

  const registrarPago = async (e) => {
    e.preventDefault();

    if (!clienteSeleccionado || !monto || Number(monto) <= 0 || !metodo.trim()) {
      setMensaje('❗ Validación fallida: revisa los campos.');
      return;
    }

    try {
      const cliente = clientes.find(c => c.id === clienteSeleccionado);
      const data = {
        clienteId: cliente.id,
        nombreCliente: cliente.nombre,
        monto: Number(monto),
        metodo,
        descripcion,
        fechaPago: Timestamp.now()
      };

      if (modoEdicion) {
        await updateDoc(doc(db, 'pagos', pagoActualId), data);
        setMensaje('✅ Pago actualizado');
      } else {
        await addDoc(collection(db, 'pagos'), data);
        setMensaje('✅ Pago registrado con éxito');
      }

      limpiarFormulario();
      const q = query(collection(db, 'pagos'), orderBy('fechaPago', 'desc'));
      const snapshot = await getDocs(q);
      setPagos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error al guardar pago:", error);
      setMensaje('❌ Error al guardar el pago');
    }
  };

  const eliminarPago = async (id) => {
    if (!window.confirm('¿Eliminar este pago?')) return;
    try {
      await deleteDoc(doc(db, 'pagos', id));
      setPagos(pagos.filter(p => p.id !== id));
      setMensaje('🗑 Pago eliminado');
    } catch (error) {
      console.error("Error al eliminar pago:", error);
    }
  };

  const cargarPagoParaEditar = (pago) => {
    const cliente = clientes.find(c => c.id === pago.clienteId);
    setClienteSeleccionado(pago.clienteId);
    setMonto(pago.monto);
    setMetodo(pago.metodo);
    setDescripcion(pago.descripcion);
    setModoEdicion(true);
    setPagoActualId(pago.id);
  };

  const exportarCSV = () => {
    const datos = pagos.map(p => ({
      cliente: p.nombreCliente,
      monto: p.monto,
      metodo: p.metodo,
      fecha: p.fechaPago.toDate().toLocaleDateString(),
      descripcion: p.descripcion
    }));
    const csv = Papa.unparse(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'pagos.csv');
  };

  const filtrarPagos = () => {
    return pagos.filter(p => {
      const coincide = p.nombreCliente.toLowerCase().includes(busqueda.toLowerCase());
      const fecha = p.fechaPago?.toDate?.();
      const dentroDeRango = (!fechaInicio || fecha >= new Date(fechaInicio)) && (!fechaFin || fecha <= new Date(fechaFin));
      return coincide && dentroDeRango;
    });
  };

  return (
    <div>
      <h2>{modoEdicion ? 'Editar Pago' : 'Registrar Pago'}</h2>
      <form onSubmit={registrarPago}>
        <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} required>
          <option value="">-- Selecciona un cliente --</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
          ))}
        </select>
        <input type="number" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} required />
        <input type="text" placeholder="Método de pago" value={metodo} onChange={(e) => setMetodo(e.target.value)} required />
        <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <button type="submit">{modoEdicion ? 'Actualizar' : 'Guardar Pago'}</button>
        {modoEdicion && <button type="button" onClick={limpiarFormulario}>Cancelar</button>}
      </form>

      {mensaje && <p>{mensaje}</p>}

      <h3>🔍 Buscar y filtrar</h3>
      <input type="text" placeholder="Buscar por cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
      <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      <button onClick={exportarCSV}>📤 Exportar CSV</button>

      <h3>Pagos Registrados</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Descripción</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrarPagos().map((pago) => (
            <tr key={pago.id}>
              <td>{pago.nombreCliente}</td>
              <td>${pago.monto}</td>
              <td>{pago.metodo}</td>
              <td>{pago.descripcion || '—'}</td>
              <td>{pago.fechaPago.toDate().toLocaleDateString()}</td>
              <td>
                <button onClick={() => cargarPagoParaEditar(pago)}>✏️</button>
                <button onClick={() => eliminarPago(pago.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Pagos;

