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
    <div>
      <h2>{modoEdicion ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
      <form onSubmit={guardarCliente}>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <input type="text" placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        <textarea placeholder="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        <button type="submit">{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
        {modoEdicion && <button type="button" onClick={limpiarFormulario}>Cancelar</button>}
      </form>

      {mensaje && <p>{mensaje}</p>}

      <h3>🔍 Buscar y filtrar</h3>
      <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
      <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      <button onClick={exportarCSV}>📤 Exportar CSV</button>

      <h3>Clientes Registrados</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Observaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrarClientes().map((cliente) => (
            <tr key={cliente.id}>
              <td>{cliente.nombre}</td>
              <td>{cliente.correo}</td>
              <td>{cliente.telefono}</td>
              <td>{cliente.direccion}</td>
              <td>{cliente.observaciones || '—'}</td>
              <td>
                <button onClick={() => cargarClienteParaEditar(cliente)}>✏️ Editar</button>{' '}
                <button onClick={() => eliminarCliente(cliente.id)}>🗑 Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Clientes;
