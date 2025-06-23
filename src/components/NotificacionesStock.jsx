import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

// Utilidad para almacenar y leer del localStorage
const getIgnorados = () =>
  JSON.parse(localStorage.getItem("notificaciones_ignoradas") || "[]");
const setIgnorados = (arr) =>
  localStorage.setItem("notificaciones_ignoradas", JSON.stringify(arr));

function ListaNotificaciones({ notificaciones, onIgnore, onClose }) {
  if (!notificaciones.length)
    return <div className="p-4">No hay notificaciones</div>;
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">Notificaciones de stock</h3>
      <ul>
        {notificaciones.map((n, i) => (
          <li key={n.id} className="mb-2 text-red-600 flex items-center gap-2">
            <span>
              <b>{n.nombre}</b> tiene solo <b>{n.stock}</b> unidades en stock.
            </span>
            <button
              className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-400"
              onClick={() => onIgnore(n.id)}
              title="Ignorar esta notificación"
            >
              Ignorar
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-secondary mt-3" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}

export default function NotificacionesStock({ umbral = 5, reloadKey }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [show, setShow] = useState(false);
  const [ignorados, setIgnoradosState] = useState(getIgnorados());

  // Recarga ignorados del localStorage cuando el modal abre (por si cambia en otra pestaña)
  useEffect(() => {
    if (show) setIgnoradosState(getIgnorados());
  }, [show]);

  useEffect(() => {
    const obtenerProductos = async () => {
      const q = query(collection(db, "productos"), orderBy("nombre", "asc"));
      const snapshot = await getDocs(q);
      const productosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Filtra los ignorados
      const productosBajoStock = productosData.filter(
        (p) => Number(p.stock) <= umbral && !ignorados.includes(p.id)
      );
      setNotificaciones(productosBajoStock);
    };
    obtenerProductos();
  }, [umbral, reloadKey, ignorados]);

  // Cuando ignoras una notificación, la agregas a ignorados y la guardas
  const handleIgnore = (id) => {
    const nuevos = [...ignorados, id];
    setIgnoradosState(nuevos);
    setIgnorados(nuevos);
  };

  return (
    <>
      {/* Botón de notificaciones */}
      <button
        className="relative btn-secondary"
        onClick={() => setShow(true)}
        style={{ fontSize: 24, position: "fixed", top: 24, right: 24, zIndex: 110 }}
        title="Notificaciones"
      >
        🔔
        {notificaciones.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "red",
              color: "white",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            {notificaciones.length}
          </span>
        )}
      </button>

      {/* Modal/desplegable de notificaciones */}
      {show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-end items-start z-50"
          onClick={() => setShow(false)}
        >
          <div
            className="bg-white rounded shadow-xl mt-24 mr-8"
            style={{ minWidth: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <ListaNotificaciones
              notificaciones={notificaciones}
              onIgnore={handleIgnore}
              onClose={() => setShow(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}