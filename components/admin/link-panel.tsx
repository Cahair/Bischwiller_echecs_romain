"use client";

import { useState, useSyncExternalStore } from "react";
import type { LinkState } from "@/app/admin/account-actions";
import { Icon } from "./icons";
import styles from "./admin.module.css";

type CreatedLink = NonNullable<LinkState["link"]>;

const noSubscription = () => () => {};

function formatExpiry(time: number): string {
  return new Date(time).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/**
 * Le lien tout juste créé, prêt à partir : tel quel, ou dans un message rédigé
 * d’avance. Il ne s’affiche qu’une fois — le serveur n’en garde que l’empreinte.
 */
export function LinkPanel({ link }: { link: CreatedLink }) {
  // L’adresse publique du site vient du navigateur : derrière le proxy de
  // l’hébergeur, le serveur ne la connaît pas toujours.
  const origin = useSyncExternalStore(noSubscription, () => window.location.origin, () => "");
  const [copied, setCopied] = useState<"lien" | "message" | null>(null);

  const url = origin + link.path;
  const firstName = link.name.split(" ")[0];
  const until = formatExpiry(link.expiresAt);
  const invitation = link.kind === "invitation";
  const subject = invitation ? "Votre accès à l’espace de rédaction du club" : "Votre nouveau mot de passe pour l’espace de rédaction";
  const message = invitation
    ? `Bonjour ${firstName},\n\nVoici votre lien pour créer votre accès à l’espace de rédaction du site du club :\n${url}\n\nVous y choisirez vous-même votre mot de passe. Votre identifiant sera : ${link.login}\nLe lien ne sert qu’une fois et reste valable jusqu’au ${until}.`
    : `Bonjour ${firstName},\n\nVoici votre lien pour choisir un nouveau mot de passe pour l’espace de rédaction du site du club :\n${url}\n\nVotre identifiant reste : ${link.login}\nLe lien ne sert qu’une fois et reste valable jusqu’au ${until}.`;

  async function copy(what: "lien" | "message") {
    const text = what === "lien" ? url : message;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // Presse-papiers refusé par le navigateur : le texte s’offre à la copie manuelle.
      window.prompt("Copiez ce texte (Ctrl+C), puis collez-le dans votre message :", text);
    }
  }

  return (
    <div className={styles.linkPanel} role="status">
      <p className={styles.linkPanelTitle}>
        <Icon name="check" />
        {invitation ? `Lien d’invitation créé pour ${link.name}` : `Lien de nouveau mot de passe créé pour ${link.name}`}
      </p>
      <input
        className={`${styles.input} ${styles.linkField}`}
        value={url}
        readOnly
        aria-label="Lien à transmettre"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className={styles.linkActions}>
        <button type="button" className={styles.button} onClick={() => void copy("lien")}>
          <Icon name={copied === "lien" ? "check" : "copy"} /> {copied === "lien" ? "Lien copié" : "Copier le lien"}
        </button>
        <button type="button" className={styles.buttonGhost} onClick={() => void copy("message")}>
          <Icon name={copied === "message" ? "check" : "copy"} /> {copied === "message" ? "Message copié" : "Copier un message tout prêt"}
        </button>
        <a className={styles.buttonGhost} href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}>
          <Icon name="mail" /> Envoyer par e-mail
        </a>
        <a className={styles.buttonGhost} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
          Envoyer par WhatsApp
        </a>
      </div>
      <p className={styles.linkNote}>
        Valable une seule fois, jusqu’au {until}. Il ne sera plus affiché ensuite : envoyez-le maintenant. S’il se perd, créez-en
        simplement un autre, qui remplacera celui-ci.
      </p>
    </div>
  );
}
