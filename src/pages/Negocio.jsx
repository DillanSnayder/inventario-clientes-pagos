import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Negocio() {
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

  useEffect(() => {
    async function cargar() {
      const ref = doc(db, "configuracion", "negocio");
      const snap = await getDoc(ref);
      if (snap.exists()) setForm(snap.data());
      // Si no existe, los campos quedan vacíos para añadir datos.
    }
    cargar();
  }, []);

  async function guardar(e) {
    e.preventDefault();
    const ref = doc(db, "configuracion", "negocio");
    await setDoc(ref, form, { merge: true });
    setMsg("Datos guardados correctamente");
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow my-12">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Datos del Negocio</h2>
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
      {form.logo && <img src={form.logo} alt="Logo" className="h-24 mt-4" />}
    </div>
  );
}