import { NextResponse } from "next/server";
import { readSession } from "@/lib/admin/session";
import { MAX_UPLOAD_BYTES, saveUpload } from "@/lib/admin/media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `Fichier trop lourd (maximum ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo).` }, { status: 413 });
  }

  try {
    const saved = saveUpload({ name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Envoi impossible." }, { status: 400 });
  }
}
