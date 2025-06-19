// src/components/Inventario.jsx
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

function Inventario() {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stock, setStock] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [productos, setProductos] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoActualId, setProductoActualId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const obtenerProductos = async () => {
    try {
      const q = query(collection(db, 'inventario'), orderBy('fechaIngreso', 'desc'));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    setCategoria('');
    setStock('');
    setPrecio('');
    setDescripcion('');
    setModoEdicion(false);
    setProductoActualId(null);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || stock <= 0 || precio <= 0) {
      setMensaje('❗ Validación fallida.');
      return;
    }

    try {
      if (modoEdicion) {
        const ref = doc(db, 'inventario', productoActualId);
        await updateDoc(ref, {
          nombre,
          categoria,
          stock: Number(stock),
          precio: Number(precio),
          descripcion
        });
        setMensaje('✅ Producto actualizado');
      } else {
        await addDoc(collection(db, 'inventario'), {
          nombre,
          categoria,
          stock: Number(stock),
          precio: Number(precio),
          descripcion,
          fechaIngreso: Timestamp.now()
        });
        setMensaje('✅ Producto registrado correctamente');
      }
      limpiarFormulario();
      obtenerProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setMensaje('❌ Error al guardar el producto');
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await deleteDoc(doc(db, 'inventario', id));
      setMensaje('🗑 Producto eliminado');
      obtenerProductos();
    } catch (error) {
      console.error(error);
    }
  };

  const cargarProductoParaEditar = (producto) => {
    setNombre(producto.nombre);
    setCategoria(producto.categoria);
    setStock(producto.stock);
    setPrecio(producto.precio);
    setDescripcion(producto.descripcion);
    setModoEdicion(true);
    setProductoActualId(producto.id);
  };

  const exportarCSV = () => {
    const datos = productos.map(p => ({ nombre: p.nombre, categoria: p.categoria, stock: p.stock, precio: p.precio }));
    const csv = Papa.unparse(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'inventario.csv');
  };

  const filtrarProductos = () => {
    return productos.filter(p => {
      const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const fecha = p.fechaIngreso?.toDate?.();
      const dentroDeRango = (!fechaInicio || fecha >= new Date(fechaInicio)) && (!fechaFin || fecha <= new Date(fechaFin));
      return coincideBusqueda && dentroDeRango;
    });
  };

  return (
    <div>
      <h2>{modoEdicion ? 'Editar Producto' : 'Registrar Producto'}</h2>
      <form onSubmit={guardarProducto}>
        <input type="text" placeholder="Nombre del producto" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input type="text" placeholder="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
        <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} required />
        <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
        <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <button type="submit">{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
        {modoEdicion && <button type="button" onClick={limpiarFormulario}>Cancelar</button>}
      </form>
      {mensaje && <p>{mensaje}</p>}

      <h3>🔍 Buscar y filtrar</h3>
      <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
      <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      <button onClick={exportarCSV}>📤 Exportar CSV</button>

      <h3>Inventario</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrarProductos().map((producto) => (
            <tr key={producto.id}>
              <td>{producto.nombre}</td>
              <td>{producto.categoria}</td>
              <td>{producto.stock}</td>
              <td>{producto.precio}</td>
              <td>{producto.descripcion || '—'}</td>
              <td>
                <button onClick={() => cargarProductoParaEditar(producto)}>✏️ Editar</button>{' '}
                <button onClick={() => eliminarProducto(producto.id)}>🗑 Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventario;
