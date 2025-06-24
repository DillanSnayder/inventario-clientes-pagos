import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Negocio() {
  const [negocio, setNegocio] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: "",
    ciudad: "",
    logo: "",
  });
  const [msg, setMsg] = useState("");

  // Cargar datos guardados al montar
  useEffect(() => {
    async function cargar() {
      const ref = doc(db, "configuracion", "negocio");
      const snap = await getDoc(ref);
      if (snap.exists()) setNegocio(snap.data());
    }
    cargar();
  }, []);

  // Al guardar, borra los campos y actualiza la tarjeta de datos
  async function guardar(e) {
    e.preventDefault();
    const ref = doc(db, "configuracion", "negocio");
    await setDoc(ref, form, { merge: true });
    setNegocio(form); // Actualiza la visualización
    setMsg("Datos guardados correctamente");
    setForm({
      nombre: "",
      nit: "",
      direccion: "",
      telefono: "",
      correo: "",
      ciudad: "",
      logo: "",
    });
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow my-12">
      {/* Tarjeta elegante con información de la empresa */}
      {negocio && (
        <div className="mb-10 bg-blue-50 p-6 rounded-xl shadow text-center">
          {negocio.logo && <img src={negocio.logo} alt="Logo" className="h-16 mx-auto mb-2 rounded" style={{objectFit:"contain"}} />}
          <div className="text-xl font-bold text-blue-900 mb-1">{negocio.nombre}</div>
          <div className="text-gray-700 mb-1">{negocio.direccion} {negocio.ciudad && "- " + negocio.ciudad}</div>
          <div className="text-gray-700 mb-1">NIT: {negocio.nit}</div>
          <div className="text-gray-700 mb-1">Tel: {negocio.telefono} </div>
          <div className="text-gray-700 mb-1">Correo: {negocio.correo}</div>
        </div>
      )}

      {/* Formulario SIEMPRE VACÍO */}
      <h2 className="text-2xl font-bold mb-6 text-blue-800 text-center">
        Actualizar datos del negocio
      </h2>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <input className="input" placeholder="Nombre" value={form.nombre} onChange={e=>setForm(f=>({...f, nombre:e.target.value}))} required/>
        <input className="input" placeholder="NIT/RUT/CUIT" value={form.nit} onChange={e=>setForm(f=>({...f, nit:e.target.value}))}/>
        <input className="input" placeholder="Dirección" value={form.direccion} onChange={e=>setForm(f=>({...f, direccion:e.target.value}))}/>
        <input className="input" placeholder="Teléfono" value={form.telefono} onChange={e=>setForm(f=>({...f, telefono:e.target.value}))}/>
        <input className="input" placeholder="Correo" value={form.correo} onChange={e=>setForm(f=>({...f, correo:e.target.value}))}/>
        <input className="input" placeholder="Ciudad" value={form.ciudad} onChange={e=>setForm(f=>({...f, ciudad:e.target.value}))}/>
        <input className="input" placeholder="URL del logo (opcional)" value={form.logo} onChange={e=>setForm(f=>({...f, logo:e.target.value}))}/>
        <button type="submit" className="btn-primary">Guardar</button>
        {msg && <div className="text-green-700">{msg}</div>}
      </form>
    </div>
  );
}