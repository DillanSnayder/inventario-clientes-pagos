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

function Productos() {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [productos, setProductos] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoActualId, setProductoActualId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const obtenerProductos = async () => {
    try {
      const q = query(collection(db, 'productos'), orderBy('fechaAlta', 'desc'));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(lista);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  useEffect(() => {
    obtenerProductos();
  }, []);

  const limpiarFormulario = () => {
    setNombre('');
    setCodigo('');
    setDescripcion('');
    setPrecio('');
    setStock('');
    setModoEdicion(false);
    setProductoActualId(null);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim() || isNaN(Number(precio)) || isNaN(Number(stock))) {
      setMensaje('❗ Validación fallida: revisa los campos.');
      return;
    }

    const productoExistente = productos.find(
      p => p.codigo === codigo && p.id !== productoActualId
    );
    if (productoExistente) {
      setMensaje('❗ Ya existe un producto con ese código.');
      return;
    }

    try {
      if (modoEdicion) {
        const ref = doc(db, 'productos', productoActualId);
        await updateDoc(ref, {
          nombre,
          codigo,
          descripcion,
          precio: Number(precio),
          stock: Number(stock)
        });
        setMensaje('✅ Producto actualizado');
      } else {
        await addDoc(collection(db, 'productos'), {
          nombre,
          codigo,
          descripcion,
          precio: Number(precio),
          stock: Number(stock),
          fechaAlta: Timestamp.now()
        });
        setMensaje('✅ Producto agregado');
      }
      limpiarFormulario();
      obtenerProductos();
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar producto');
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await deleteDoc(doc(db, 'productos', id));
      setMensaje('🗑 Producto eliminado');
      obtenerProductos();
    } catch (error) {
      console.error(error);
    }
  };

  const cargarProductoParaEditar = (producto) => {
    setNombre(producto.nombre);
    setCodigo(producto.codigo);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio);
    setStock(producto.stock);
    setModoEdicion(true);
    setProductoActualId(producto.id);
  };

  const exportarCSV = () => {
    const datos = productos.map(p => ({
      nombre: p.nombre,
      codigo: p.codigo,
      precio: p.precio,
      stock: p.stock
    }));
    const csv = Papa.unparse(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'productos.csv');
  };

  const filtrarProductos = () => {
    return productos.filter(p => {
      const coincideBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
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
        <h2 className="text-2xl font-bold mb-4 text-blue-800">{modoEdicion ? 'Editar Producto' : 'Registrar Producto'}</h2>
        <form onSubmit={guardarProducto} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input type="text" className="input" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
          <input type="text" className="input" placeholder="Código" value={codigo} onChange={e => setCodigo(e.target.value)} required />
          <textarea className="input col-span-1 md:col-span-2" placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          <input type="number" className="input" placeholder="Precio" value={precio} onChange={e => setPrecio(e.target.value)} required />
          <input type="number" className="input" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} required />
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
          <input type="text" className="input flex-1" placeholder="Buscar por nombre o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <input type="date" className="input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          <input type="date" className="input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          <button onClick={exportarCSV} className="btn-secondary">📤 Exportar CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-lg font-semibold mb-3 text-blue-700">Productos Registrados</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2">Precio</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarProductos().map((producto) => (
                <tr key={producto.id} className="border-b hover:bg-blue-50 transition">
                  <td className="px-4 py-2">{producto.nombre}</td>
                  <td className="px-4 py-2">{producto.codigo}</td>
                  <td className="px-4 py-2">{producto.descripcion || '—'}</td>
                  <td className="px-4 py-2">{producto.precio}</td>
                  <td className="px-4 py-2">{producto.stock}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => cargarProductoParaEditar(producto)} className="btn-table-edit">✏️</button>
                    <button onClick={() => eliminarProducto(producto.id)} className="btn-table-delete">🗑</button>
                  </td>
                </tr>
              ))}
              {filtrarProductos().length === 0 && (
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

export default Productos;