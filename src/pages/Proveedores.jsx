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

function Proveedores() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorActualId, setProveedorActualId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const obtenerProveedores = async () => {
    try {
      const q = query(collection(db, 'proveedores'), orderBy('fechaAlta', 'desc'));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProveedores(lista);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  useEffect(() => {
    obtenerProveedores();
  }, []);

  const limpiarFormulario = () => {
    setNombre('');
    setCorreo('');
    setTelefono('');
    setDireccion('');
    setObservaciones('');
    setModoEdicion(false);
    setProveedorActualId(null);
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.includes('@') || telefono.length < 7) {
      setMensaje('❗ Validación fallida: revisa los campos.');
      return;
    }

    const proveedorExistente = proveedores.find(
      p => p.correo === correo && p.id !== proveedorActualId
    );
    if (proveedorExistente) {
      setMensaje('❗ Ya existe un proveedor con ese correo.');
      return;
    }

    try {
      if (modoEdicion) {
        const ref = doc(db, 'proveedores', proveedorActualId);
        await updateDoc(ref, {
          nombre,
          correo,
          telefono,
          direccion,
          observaciones
        });
        setMensaje('✅ Proveedor actualizado');
      } else {
        await addDoc(collection(db, 'proveedores'), {
          nombre,
          correo,
          telefono,
          direccion,
          observaciones,
          fechaAlta: Timestamp.now()
        });
        setMensaje('✅ Proveedor agregado');
      }
      limpiarFormulario();
      obtenerProveedores();
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar proveedor');
    }
  };

  const eliminarProveedor = async (id) => {
    if (!window.confirm('¿Eliminar proveedor?')) return;
    try {
      await deleteDoc(doc(db, 'proveedores', id));
      setMensaje('🗑 Proveedor eliminado');
      obtenerProveedores();
    } catch (error) {
      console.error(error);
    }
  };

  const cargarProveedorParaEditar = (proveedor) => {
    setNombre(proveedor.nombre);
    setCorreo(proveedor.correo);
    setTelefono(proveedor.telefono);
    setDireccion(proveedor.direccion);
    setObservaciones(proveedor.observaciones);
    setModoEdicion(true);
    setProveedorActualId(proveedor.id);
  };

  const exportarCSV = () => {
    const datos = proveedores.map(p => ({
      nombre: p.nombre,
      correo: p.correo,
      telefono: p.telefono
    }));
    const csv = Papa.unparse(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'proveedores.csv');
  };

  const filtrarProveedores = () => {
    return proveedores.filter(p => {
      const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const fecha = p.fechaAlta?.toDate?.();
      const dentroDeRango =
        (!fechaInicio || fecha >= new Date(fechaInicio)) &&
        (!fechaFin || fecha <= new Date(fechaFin));
      return coincideBusqueda && dentroDeRango;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">{modoEdicion ? 'Editar Proveedor' : 'Registrar Proveedor'}</h2>
        <form onSubmit={guardarProveedor} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        <h3 className="text-lg font-semibold mb-3 text-blue-700">Proveedores Registrados</h3>
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
              {filtrarProveedores().map((proveedor) => (
                <tr key={proveedor.id} className="border-b hover:bg-blue-50 transition">
                  <td className="px-4 py-2">{proveedor.nombre}</td>
                  <td className="px-4 py-2">{proveedor.correo}</td>
                  <td className="px-4 py-2">{proveedor.telefono}</td>
                  <td className="px-4 py-2">{proveedor.direccion}</td>
                  <td className="px-4 py-2">{proveedor.observaciones || '—'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => cargarProveedorParaEditar(proveedor)} className="btn-table-edit">✏️</button>
                    <button onClick={() => eliminarProveedor(proveedor.id)} className="btn-table-delete">🗑</button>
                  </td>
                </tr>
              ))}
              {filtrarProveedores().length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-400" colSpan={6}>No hay registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Proveedores;