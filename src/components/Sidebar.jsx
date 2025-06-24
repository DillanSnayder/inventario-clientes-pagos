import useNombreNegocio from "../hooks/useNombreNegocio";

export default function Sidebar({ selected, setSelected }) {
  const nombreNegocio = useNombreNegocio();
  const items = [
    { label: "Empresa", icon: "🏢" },
    { label: "Ventas", icon: "🛒" },
    { label: "Clientes", icon: "👤" },
    { label: "Proveedor", icon: "🏢" },
    { label: "Productos", icon: "📦" },
    { label: "Empleados", icon: "🫂" },
    { label: "Estadisticas", icon: "↗️" },
    { label: "Finanzas", icon: "💶" },
  ];
  // Para depurar
  // console.log("Nombre negocio", nombreNegocio);
  return (
    <aside className="bg-gray-900 text-white w-56 min-h-screen p-5 flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-8 text-center">
        {nombreNegocio }
      </h2>
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => setSelected(item.label)}
          className={`flex items-center gap-3 px-4 py-2 rounded transition ${
            selected === item.label
              ? "bg-blue-600 font-bold"
              : "hover:bg-gray-700"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </aside>
  );
}