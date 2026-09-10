/**
 * Envoi d’une photo ou d’un PDF depuis l’éditeur. Les photos de téléphone
 * (4 000 px, 5 à 10 Mo) sont d’abord réduites dans le navigateur : l’envoi va
 * dix fois plus vite sur une connexion lente, et le site n’affiche jamais une
 * image à plus de 2 400 px.
 */
const MAX_EDGE = 2400;
const LIGHT_ENOUGH = 1.5 * 1024 * 1024;
const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp"]);
const NETWORK_ERROR = "L’envoi a échoué. Vérifiez votre connexion internet, puis réessayez.";

async function shrink(file: File): Promise<File> {
  if (!RESIZABLE.has(file.type) || typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // Format que le navigateur ne sait pas décoder : le serveur tranchera.
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= LIGHT_ENOUGH) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Une affiche ou un QR code en PNG le reste : le JPEG baverait sur le texte.
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/png" ? ".png" : ".jpg");
  return new File([blob], name, { type });
}

/** Envoie un fichier et renvoie son adresse publique ; `onProgress` reçoit un pourcentage. */
export async function uploadFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const prepared = await shrink(file);
  return new Promise((resolve, reject) => {
    // XMLHttpRequest plutôt que fetch : lui seul donne l’avancement de l’envoi.
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let payload: { url?: string; error?: string } = {};
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        // Réponse d’un intermédiaire (413 de Nginx…) plutôt que du site.
      }
      if (request.status >= 200 && request.status < 300 && payload.url) resolve(payload.url);
      else if (request.status === 413) reject(new Error("Le fichier est trop lourd pour le serveur."));
      else reject(new Error(payload.error ?? NETWORK_ERROR));
    };
    request.onerror = () => reject(new Error(NETWORK_ERROR));
    const body = new FormData();
    body.append("file", prepared);
    request.send(body);
  });
}
