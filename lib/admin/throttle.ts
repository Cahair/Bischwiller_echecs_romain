/**
 * Limite des essais de connexion, tenue en mémoire : un seul processus Node
 * sert le site, et un redémarrage qui remet les compteurs à zéro ne gêne
 * personne. Au-delà de 5 échecs en 15 minutes sur un même identifiant — ou de
 * 20 depuis une même adresse, qui essaierait des identifiants au hasard —, il
 * faut attendre que la fenêtre se libère.
 */
const WINDOW_MS = 15 * 60 * 1000;
const PER_LOGIN = 5;
const PER_ADDRESS = 20;
const failures = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
  const kept = (failures.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (kept.length > 0) failures.set(key, kept);
  else failures.delete(key);
  return kept;
}

function keys(login: string, address: string | null): [string, number][] {
  const list: [string, number][] = [[`id:${login}`, PER_LOGIN]];
  if (address) list.push([`ip:${address}`, PER_ADDRESS]);
  return list;
}

/** Minutes à attendre avant un nouvel essai ; 0 si la voie est libre. */
export function loginLockMinutes(login: string, address: string | null, now = Date.now()): number {
  let wait = 0;
  for (const [key, limit] of keys(login, address)) {
    const times = recent(key, now);
    if (times.length >= limit) wait = Math.max(wait, times[times.length - limit] + WINDOW_MS - now);
  }
  return Math.ceil(wait / 60_000);
}

export function recordLoginFailure(login: string, address: string | null, now = Date.now()): void {
  // Des identifiants inventés par milliers ne doivent pas faire gonfler la mémoire.
  if (failures.size > 5000) for (const key of [...failures.keys()]) recent(key, now);
  for (const [key] of keys(login, address)) failures.set(key, [...recent(key, now), now]);
}

export function clearLoginFailures(login: string): void {
  failures.delete(`id:${login}`);
}
