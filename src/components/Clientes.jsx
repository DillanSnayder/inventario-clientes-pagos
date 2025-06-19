// src/components/Clientes.jsx
import { useState } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

function Clientes() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');

  const agregarCliente = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'clientes'), {
        nombre,
        correo,
        fecha: new Date()
      });
      setMensaje('✅ Cliente agregado correctamente');
      setNombre('');
      setCorreo('');
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar el cliente');
    }
  };

  return (
    <div>
      <h2>Registrar Cliente</h2>
      <form onSubmit={agregarCliente}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <button type="submit">Guardar</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default Clientes;
