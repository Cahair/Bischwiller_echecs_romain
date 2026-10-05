"use server";

import { revalidatePath } from "next/cache";
import { readSession } from "@/lib/admin/session";
import { stampDate } from "@/lib/admin/store";
import { writeFeatured } from "@/lib/featured";

export type FeaturedState = { error?: string; savedAt?: string; savedEnabled?: boolean };

/** Enregistre le contenu à la une. Ouvert à tous les comptes, rédacteurs compris. */
export async function saveFeaturedForm(_state: FeaturedState, formData: FormData): Promise<FeaturedState> {
  const session = await readSession();
  if (!session) {
    return {
      error:
        "Votre session a expiré. Ouvrez l’espace admin dans un autre onglet pour vous reconnecter, puis revenez ici et cliquez de nouveau sur le bouton : votre texte est conservé.",
    };
  }

  const enabled = formData.get("enabled") === "on";
  const title = String(formData.get("title") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  if (enabled && !title) {
    return { error: "Donnez un titre au contenu à la une (étape 1), ou éteignez l’interrupteur pour le retirer du site." };
  }

  try {
    writeFeatured({
      enabled,
      title,
      // Les navigateurs envoient les retours à la ligne d’une zone de texte en
      // CRLF : le fichier, lui, est relu et versionné comme du texte Unix.
      text: String(formData.get("text") ?? "").replace(/\r\n/g, "\n").trim(),
      image: image.startsWith("/") ? image : "",
      imageAlt: String(formData.get("imageAlt") ?? "").trim(),
      updatedAt: stampDate(new Date()),
      updatedBy: session.name,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Enregistrement impossible." };
  }

  // La page d’accueil est rendue statiquement : sans purge, la une ne changerait pas.
  revalidatePath("/");
  revalidatePath("/admin/une");
  const savedAt = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return { savedAt, savedEnabled: enabled };
}
