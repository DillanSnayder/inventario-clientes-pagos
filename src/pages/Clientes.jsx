import { useEffect, useState } from 'react';
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

function Clientes() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [clientes, setClientes] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteActualId, setClienteActualId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const obtenerClientes = async () => {
    try {
      const q = query(collection(db, 'clientes'), orderBy('fechaAlta', 'desc'));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(lista);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  const limpiarFormulario = () => {
    setNombre('');
    setCorreo('');
    setTelefono('');
    setDireccion('');
    setObservaciones('');
    setModoEdicion(false);
    setClienteActualId(null);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.includes('@') || telefono.length < 7) {
      setMensaje('❗ Validación fallida: revisa los campos.');
      return;
    }

    const clienteExistente = clientes.find(c => c.correo === correo && c.id !== clienteActualId);
    if (clienteExistente) {
      setMensaje('❗ Ya existe un cliente con ese correo.');
      return;
    }

    try {
      if (modoEdicion) {
        const ref = doc(db, 'clientes', clienteActualId);
        await updateDoc(ref, {
          nombre,
          correo,
          telefono,
          direccion,
          observaciones
        });
        setMensaje('✅ Cliente actualizado');
      } else {
        await addDoc(collection(db, 'clientes'), {
          nombre,
          correo,
          telefono,
          direccion,
          observaciones,
          fechaAlta: Timestamp.now()
        });
        setMensaje('✅ Cliente agregado');
      }
      limpiarFormulario();
      obtenerClientes();
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar cliente');
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await deleteDoc(doc(db, 'clientes', id));
      setMensaje('🗑 Cliente eliminado');
      obtenerClientes();
    } catch (error) {
      console.error(error);
    }
  };

  const cargarClienteParaEditar = (cliente) => {
    setNombre(cliente.nombre);
    setCorreo(cliente.correo);
    setTelefono(cliente.telefono);
    setDireccion(cliente.direccion);
    setObservaciones(cliente.observaciones);
    setModoEdicion(true);
    setClienteActualId(cliente.id);
  };

  const exportarCSV = () => {
    const datos = clientes.map(c => ({
      nombre: c.nombre,
      correo: c.correo,
      telefono: c.telefono
    }));
    const csv = Papa.unparse(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'clientes.csv');
  };

  const filtrarClientes = () => {
    return clientes.filter(c => {
      const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const fecha = c.fechaAlta?.toDate?.();
      const dentroDeRango =
        (!fechaInicio || fecha >= new Date(fechaInicio)) &&
        (!fechaFin || fecha <= new Date(fechaFin));
      return coincideBusqueda && dentroDeRango;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">{modoEdicion ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
        <form onSubmit={guardarCliente} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" className="input" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
          <input type="email" className="input" placeholder="Correo" value={correo} onChange={e => setCorreo(e.target.value)} required />
          <input type="text" className="input" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
          <input type="text" className="input" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} />
          <textarea className="input col-span-1 md:col-span-2" placeholder="Observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
          <div className="flex gap-2 col-span-1 md:col-span-2">
            <button type="submit" className="btn-primary">{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            {modoEdicion && <button type="button" className="btn-secondary" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
        </form>
        {mensaje && <p className="mt-2 text-center text-sm">{mensaje}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h3 className="text-lg font-semibold mb-3 text-blue-700">🔍 Buscar y filtrar</h3>
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input type="text" className="input flex-1" placeholder="Buscar por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <input type="date" className="input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          <input type="date" className="input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          <button onClick={exportarCSV} className="btn-secondary">📤 Exportar CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-lg font-semibold mb-3 text-blue-700">Clientes Registrados</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Teléfono</th>
                <th className="px-4 py-2">Dirección</th>
                <th className="px-4 py-2">Observaciones</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarClientes().map((cliente) => (
                <tr key={cliente.id} className="border-b hover:bg-blue-50 transition">
                  <td className="px-4 py-2">{cliente.nombre}</td>
                  <td className="px-4 py-2">{cliente.correo}</td>
                  <td className="px-4 py-2">{cliente.telefono}</td>
                  <td className="px-4 py-2">{cliente.direccion}</td>
                  <td className="px-4 py-2">{cliente.observaciones || '—'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => cargarClienteParaEditar(cliente)} className="btn-table-edit">✏️</button>
                    <button onClick={() => eliminarCliente(cliente.id)} className="btn-table-delete">🗑</button>
                  </td>
                </tr>
              ))}
              {filtrarClientes().length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-400" colSpan={6}>No hay registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utiliza los mismos estilos para los mensajes y tablas en las otras clases */}
    </div>
  );
}

export default Clientes;
