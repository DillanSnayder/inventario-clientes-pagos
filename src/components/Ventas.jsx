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
    <div>
      <h2>{modoEdicion ? 'Editar Venta' : 'Registrar Venta'}</h2>
      <form onSubmit={registrarVenta}>
        <select
          value={clienteSeleccionado}
          onChange={(e) => setClienteSeleccionado(e.target.value)}
          required
        >
          <option value="">-- Selecciona un cliente --</option>
          {clientes.map(cliente => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>

        <select
          value={productoSeleccionado}
          onChange={(e) => setProductoSeleccionado(e.target.value)}
          required
        >
          <option value="">-- Selecciona un producto --</option>
          {productos.map(producto => (
            <option key={producto.id} value={producto.id}>
              {producto.nombre} (${producto.precio}) - Stock: {producto.stock}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <button type="submit">{modoEdicion ? 'Actualizar' : 'Guardar Venta'}</button>
        {modoEdicion && <button type="button" onClick={limpiarFormulario}>Cancelar</button>}
      </form>
      {mensaje && <p>{mensaje}</p>}

      <h3>🔍 Buscar y filtrar</h3>
      <input type="text" placeholder="Buscar por cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
      <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      <button onClick={exportarCSV}>📤 Exportar CSV</button>

      <h3>Ventas Registradas</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrarVentas().map((venta) => (
            <tr key={venta.id}>
              <td>{venta.nombreCliente}</td>
              <td>{venta.productos[0].nombre}</td>
              <td>{venta.productos[0].cantidad}</td>
              <td>${venta.productos[0].precioUnitario}</td>
              <td>${venta.total}</td>
              <td>
                <button onClick={() => cargarVentaParaEditar(venta)}>✏️ Editar</button>{' '}
                <button onClick={() => eliminarVenta(venta.id)}>🗑 Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ventas;
