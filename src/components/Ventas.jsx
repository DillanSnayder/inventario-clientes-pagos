import { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

function Ventas() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ventaActualId, setVentaActualId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      const productosSnapshot = await getDocs(collection(db, 'inventario'));
      const ventasSnapshot = await getDocs(query(collection(db, 'ventas'), orderBy('fechaVenta', 'desc')));

      setClientes(clientesSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre
      })));

      setProductos(productosSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        precio: doc.data().precio,
        stock: doc.data().stock ?? 0
      })));

      setVentas(ventasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    };

    fetchData();
  }, []);

  const limpiarFormulario = () => {
    setClienteSeleccionado('');
    setProductoSeleccionado('');
    setCantidad('');
    setDescripcion('');
    setModoEdicion(false);
    setVentaActualId(null);
  };

  const registrarVenta = async (e) => {
    e.preventDefault();
    try {
      const cliente = clientes.find(c => c.id === clienteSeleccionado);
      const producto = productos.find(p => p.id === productoSeleccionado);
      const cantidadVendida = Number(cantidad);

      if (!cliente || !producto) {
        setMensaje('❌ Selección inválida');
        return;
      }

      if (cantidadVendida <= 0) {
        setMensaje('❌ La cantidad debe ser mayor que cero');
        return;
      }

      const productoRef = doc(db, 'inventario', producto.id);
      const productoSnapshot = await getDocs(collection(db, 'inventario'));
      const productoDoc = productoSnapshot.docs.find(doc => doc.id === producto.id);
      const stockActual = productoDoc?.data()?.stock ?? 0;

      if (!modoEdicion && stockActual < cantidadVendida) {
        setMensaje(`❌ Stock insuficiente. Disponibles: ${stockActual}`);
        return;
      }

      const total = producto.precio * cantidadVendida;

      const venta = {
        clienteId: cliente.id,
        nombreCliente: cliente.nombre,
        productos: [{
          idProducto: producto.id,
          nombre: producto.nombre,
          cantidad: cantidadVendida,
          precioUnitario: producto.precio
        }],
        total,
        descripcion,
        fechaVenta: Timestamp.now()
      };

      if (modoEdicion) {
        await updateDoc(doc(db, 'ventas', ventaActualId), venta);
        setMensaje('✅ Venta actualizada');
      } else {
        await addDoc(collection(db, 'ventas'), venta);
        await updateDoc(productoRef, {
          stock: stockActual - cantidadVendida
        });
        setMensaje('✅ Venta registrada y stock actualizado');
      }

      limpiarFormulario();
      const snapshot = await getDocs(query(collection(db, 'ventas'), orderBy('fechaVenta', 'desc')));
      setVentas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error al registrar venta:', error);
      setMensaje('❌ Error al guardar la venta');
    }
  };

  const eliminarVenta = async (id) => {
    if (!window.confirm('¿Eliminar esta venta?')) return;
    try {
      await deleteDoc(doc(db, 'ventas', id));
      setMensaje('🗑 Venta eliminada');
      setVentas(ventas.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error al eliminar venta:', error);
    }
  };

  const cargarVentaParaEditar = (venta) => {
    const producto = venta.productos[0];
    setClienteSeleccionado(venta.clienteId);
    setProductoSeleccionado(producto.idProducto);
    setCantidad(producto.cantidad);
    setDescripcion(venta.descripcion);
    setModoEdicion(true);
    setVentaActualId(venta.id);
  };

  const exportarCSV = () => {
    const datos = ventas.map(v => ({
      cliente: v.nombreCliente,
      producto: v.productos[0].nombre,
      cantidad: v.productos[0].cantidad,
      precio: v.productos[0].precioUnitario,
      total: v.total
    }));
    const csv = Papa.unparse(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'ventas.csv');
  };

  const filtrarVentas = () => {
    return ventas.filter(v => {
      const coincideBusqueda = v.nombreCliente.toLowerCase().includes(busqueda.toLowerCase());
      const fecha = v.fechaVenta?.toDate?.();
      const dentroDeRango = (!fechaInicio || fecha >= new Date(fechaInicio)) && (!fechaFin || fecha <= new Date(fechaFin));
      return coincideBusqueda && dentroDeRango;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="bg-white shadow-md rounded-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">{modoEdicion ? 'Editar Venta' : 'Registrar Venta'}</h2>
        <form onSubmit={registrarVenta} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">-- Selecciona un cliente --</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Producto</label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">-- Selecciona un producto --</option>
              {productos.map(producto => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} (${producto.precio}) - Stock: {producto.stock}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
            >
              {modoEdicion ? 'Actualizar' : 'Guardar Venta'}
            </button>
            {modoEdicion && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {mensaje && <p className="mt-4 text-center text-lg">{mensaje}</p>}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">🔍 Buscar y filtrar</h3>
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="p-2 border rounded w-full md:w-1/3"
          />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="p-2 border rounded w-full md:w-1/4"
          />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="p-2 border rounded w-full md:w-1/4"
          />
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            📤 Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ventas Registradas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtrarVentas().map((venta) => (
                <tr key={venta.id}>
                  <td className="px-6 py-4">{venta.nombreCliente}</td>
                  <td className="px-6 py-4">{venta.productos[0].nombre}</td>
                  <td className="px-6 py-4">{venta.productos[0].cantidad}</td>
                  <td className="px-6 py-4">${venta.productos[0].precioUnitario}</td>
                  <td className="px-6 py-4 font-semibold">${venta.total}</td>
                  <td className="px-6 py-4 flex gap-2 justify-center">
                    <button
                      onClick={() => cargarVentaParaEditar(venta)}
                      className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminarVenta(venta.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {filtrarVentas().length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No hay ventas registradas para los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Ventas;