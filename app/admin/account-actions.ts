"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  accessLinkPath,
  cancelAccessLink,
  createAccessLink,
  redeemAccessLink,
  removeAccount,
  type AccessLink,
} from "@/lib/admin/accounts";
import { openSession, readAdminSession } from "@/lib/admin/session";
import { MIN_PASSWORD_LENGTH, readAdminUsers } from "@/lib/admin/users";

/** Réponse d’une création de lien : le chemin n’est donné qu’une fois, à qui vient de le créer. */
export type LinkState = {
  error?: string;
  link?: { path: string; name: string; login: string; kind: AccessLink["kind"]; expiresAt: number };
};

const NOT_ALLOWED = "Seul un administrateur peut gérer les comptes. Si votre session a expiré, reconnectez-vous.";

function created(token: string, link: AccessLink): LinkState {
  revalidatePath("/admin/comptes");
  return { link: { path: accessLinkPath(token), name: link.name, login: link.login, kind: link.kind, expiresAt: link.expiresAt } };
}

export async function inviteMember(_state: LinkState, formData: FormData): Promise<LinkState> {
  const session = await readAdminSession();
  if (!session) return { error: NOT_ALLOWED };
  try {
    const { token, link } = createAccessLink({
      kind: "invitation",
      login: String(formData.get("login") ?? ""),
      name: String(formData.get("name") ?? ""),
      role: formData.get("role") === "admin" ? "admin" : "redacteur",
      createdBy: session.login,
    });
    return created(token, link);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "L’invitation n’a pas pu être créée." };
  }
}

export async function createResetLink(_state: LinkState, formData: FormData): Promise<LinkState> {
  const session = await readAdminSession();
  if (!session) return { error: NOT_ALLOWED };
  const user = readAdminUsers().find((candidate) => candidate.login === String(formData.get("login") ?? ""));
  if (!user) return { error: "Ce compte n’existe plus." };
  const { token, link } = createAccessLink({
    kind: "reinitialisation",
    login: user.login,
    name: user.name,
    role: user.role,
    createdBy: session.login,
  });
  return created(token, link);
}

export async function cancelLink(formData: FormData): Promise<void> {
  if (!(await readAdminSession())) redirect("/admin");
  cancelAccessLink(String(formData.get("id") ?? ""));
  revalidatePath("/admin/comptes");
}

export async function removeMember(formData: FormData): Promise<void> {
  const session = await readAdminSession();
  if (!session) redirect("/admin");
  const login = String(formData.get("login") ?? "");
  // Se retirer soi-même fermerait la porte derrière soi : la page ne le propose pas.
  if (login && login !== session.login) {
    try {
      removeAccount(login);
    } catch {
      // Déjà retiré (double clic) : rien à faire.
    }
  }
  revalidatePath("/admin/comptes");
}

/** Page publique du lien : le membre choisit son mot de passe et entre aussitôt. */
export async function acceptAccessLink(_state: LinkState, formData: FormData): Promise<LinkState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Votre mot de passe doit compter au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }
  if (password !== String(formData.get("confirmation") ?? "")) {
    return { error: "Les deux mots de passe ne sont pas identiques : retapez-les." };
  }
  try {
    await openSession(redeemAccessLink(token, password));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "L’accès n’a pas pu être créé." };
  }
  revalidatePath("/admin/comptes");
  redirect("/admin?bienvenue=1");
}
