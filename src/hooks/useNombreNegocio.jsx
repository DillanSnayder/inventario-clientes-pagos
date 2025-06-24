import { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function useNombreNegocio() {
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    async function cargar() {
      const snap = await getDoc(doc(db, "configuracion", "negocio"));
      if (snap.exists()) setNombre(snap.data().nombre || "");
    }
    cargar();
  }, []);
  return nombre;
}