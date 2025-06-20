import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/clientes", label: "Clientes", icon: "👤" },
  { path: "/productos", label: "Productos", icon: "📦" },
  { path: "/pagos", label: "Pagos", icon: "💳" },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="bg-gradient-to-b from-blue-900 to-blue-700 text-white w-64 min-h-screen flex flex-col shadow-lg">
      <div className="p-6 text-2xl font-bold tracking-widest border-b border-blue-800">
        Panel Admin
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition 
              ${location.pathname === item.path ? "bg-blue-600 shadow" : "hover:bg-blue-800"}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-800 text-sm text-blue-200">
        <span>© {new Date().getFullYear()} Tu Empresa</span>
      </div>
    </aside>
  );
}