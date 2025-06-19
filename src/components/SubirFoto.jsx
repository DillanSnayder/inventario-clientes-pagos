import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebaseConfig';

function SubirFoto() {
  const [archivo, setArchivo] = useState(null);
  const [url, setUrl] = useState('');
  const [mensaje, setMensaje] = useState('');

  const subirImagen = async (e) => {
    e.preventDefault();

    if (!archivo) {
      console.log("⚠️ No se seleccionó ningún archivo.");
      setMensaje('❌ No has seleccionado una imagen.');
      return;
    }

    try {
      console.log("🚀 Intentando subir el archivo:", archivo);

      const nombre = `clientes/${Date.now()}_${archivo.name}`;
      const storageRef = ref(storage, nombre);

      console.log("📦 Referencia creada en Storage:", storageRef.fullPath);

      const snapshot = await uploadBytes(storageRef, archivo);
      console.log("✅ Archivo subido con éxito:", snapshot);

      const urlDescarga = await getDownloadURL(snapshot.ref);
      console.log("🔗 URL de descarga:", urlDescarga);

      setUrl(urlDescarga);
      setMensaje('✅ Imagen subida con éxito.');
    } catch (error) {
      console.error('❌ Error al subir la imagen:', error);
      setMensaje('❌ Falló la subida.');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Subir imagen a Firebase</h2>
      <form onSubmit={subirImagen}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const archivoSeleccionado = e.target.files[0];
            console.log("📂 Archivo seleccionado:", archivoSeleccionado);
            setArchivo(archivoSeleccionado);
          }}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Subir</button>
      </form>

      {mensaje && <p>{mensaje}</p>}

      {url && (
        <div>
          <p>📎 URL de la imagen:</p>
          <a href={url} target="_blank" rel="noreferrer">{url}</a>
          <br />
          <img
            src={url}
            alt="Vista previa"
            style={{ maxWidth: '300px', marginTop: '10px', border: '1px solid #ccc' }}
          />
        </div>
      )}
    </div>
  );
}

export default SubirFoto;

