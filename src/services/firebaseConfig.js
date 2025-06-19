// src/services/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // ✅ Agregado para subir imágenes

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBZ-_53ew-Lx1gEaw45UQ5cB44fPIEBI2g",
  authDomain: "inventarioclientespagos.firebaseapp.com",
  projectId: "inventarioclientespagos",
  storageBucket: "inventarioclientespagos.appspot.com", // ✅ Confirmado
  messagingSenderId: "175754344169",
  appId: "1:175754344169:web:6c22689f927574c85fe278",
  measurementId: "G-ZLNH1X9650"
};

// Inicializar la app
const app = initializeApp(firebaseConfig);

// Servicios que vas a usar
const db = getFirestore(app);     // Base de datos (Firestore)
const auth = getAuth(app);        // Autenticación
const storage = getStorage(app);  // ✅ Almacenamiento de archivos (Storage)

// Exportar todo lo necesario
export { db, auth, storage };


