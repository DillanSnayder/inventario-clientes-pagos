import { useState } from "react";
import Ventas from "./components/Ventas";

function App() {
  const [mostrarVentas, setMostrarVentas] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 to-blue-300 flex items-center justify-center">
      <div className="bg-white shadow-2xl rounded-3xl p-12 w-full max-w-3xl flex flex-col items-center">
        {!mostrarVentas ? (
          <>
            <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Bienvenido</h1>
            <p className="mb-8 text-lg text-gray-700 text-center">
              Este es tu sistema de control de clientes, productos y ventas.<br />
              Haz clic en el siguiente botón para comenzar a registrar ventas.
            </p>
            <button
              className="px-8 py-4 text-xl bg-blue-700 hover:bg-blue-800 transition text-white rounded-full shadow-lg font-bold"
              onClick={() => setMostrarVentas(true)}
            >
              Ir a Ventas 🚀
            </button>
          </>
        ) : (
          <>
            <div className="w-full flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900">Gestión de Ventas</h2>
              <button
                className="py-2 px-5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-semibold"
                onClick={() => setMostrarVentas(false)}
              >
                ← Volver
              </button>
            </div>
            <Ventas />
          </>
        )}
      </div>
    </div>
  );
}

export default App;