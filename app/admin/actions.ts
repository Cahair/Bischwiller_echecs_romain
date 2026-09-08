"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticate } from "@/lib/admin/users";
import { closeSession, openSession, readSession } from "@/lib/admin/session";
import { fromInputDate, removeArticle, saveArticle, stampDate } from "@/lib/admin/store";

export type FormState = { error?: string; savedAt?: string };

/**
 * Le site est rendu statiquement : sans purge explicite, un article écrit sur
 * le disque resterait invisible jusqu’au prochain déploiement.
 */
function refreshPublicPages(...slugs: (string | null)[]): void {
  revalidatePath("/");
  revalidatePath("/actualites");
  for (const slug of slugs) if (slug) revalidatePath(`/actualites/${slug}`);
}

function list(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function signIn(_state: FormState, formData: FormData): Promise<FormState> {
  const login = String(formData.get("login") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!login || !password) return { error: "Identifiant et mot de passe sont requis." };

  const user = authenticate(login, password);
  if (!user) return { error: "Identifiant ou mot de passe incorrect." };

  try {
    await openSession(user);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ouverture de session impossible." };
  }
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await closeSession();
  redirect("/admin/connexion");
}

export async function saveArticleForm(_state: FormState, formData: FormData): Promise<FormState> {
  const session = await readSession();
  if (!session) return { error: "Session expirée. Reconnectez-vous dans un autre onglet, puis réessayez." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Le titre est obligatoire." };
  const contentMarkdown = String(formData.get("contentMarkdown") ?? "").trim();
  const status = formData.get("intent") === "publish" ? "publish" : "draft";
  if (status === "publish" && !contentMarkdown) return { error: "Un article publié ne peut pas être vide." };

  const previousSlug = String(formData.get("previousSlug") ?? "") || null;
  const publishedAt = String(formData.get("publishedAt") ?? "");

  let saved;
  try {
    saved = saveArticle(
      {
        title,
        slug: String(formData.get("slug") ?? "").trim() || title,
        publishedAt: publishedAt ? fromInputDate(publishedAt) : stampDate(new Date()),
        author: String(formData.get("author") ?? session.name),
        status,
        excerpt: String(formData.get("excerpt") ?? ""),
        categories: list(formData.get("categories")),
        tags: list(formData.get("tags")),
        featuredImage: String(formData.get("featuredImage") ?? ""),
        featuredImageFit: formData.get("featuredImageFit") ? "contain" : null,
        contentMarkdown,
      },
      previousSlug,
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Enregistrement impossible." };
  }

  refreshPublicPages(saved.slug, previousSlug);
  revalidatePath("/admin");
  // Création ou renommage : l’URL d’édition change, on suit l’article.
  if (saved.slug !== previousSlug) redirect(`/admin/articles/${saved.slug}?enregistre=1`);
  return { savedAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
}

export async function deleteArticleForm(formData: FormData): Promise<void> {
  const session = await readSession();
  if (!session) redirect("/admin/connexion");

  const slug = String(formData.get("slug") ?? "");
  if (slug) {
    removeArticle(slug);
    refreshPublicPages(slug);
    revalidatePath("/admin");
  }
  redirect("/admin");
}
