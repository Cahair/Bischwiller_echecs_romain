"use client";

import type { MouseEvent } from "react";

const CONTACT_EMAIL = "bischwiller.echecs1981@gmail.com";
const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`;

function ContactIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 24">
      <path d="M3 5.25A2.25 2.25 0 0 1 5.25 3h12.5A2.25 2.25 0 0 1 20 5.25v9.5A2.25 2.25 0 0 1 17.75 17H5.25A2.25 2.25 0 0 1 3 14.75v-9.5Zm2.1.25 6.4 4.8 6.4-4.8H5.1Zm12.9 2-5.9 4.42a1 1 0 0 1-1.2 0L5 7.5v7.25c0 .14.11.25.25.25h12.5a.25.25 0 0 0 .25-.25V7.5Z" />
      <path d="M17 12.25A2.25 2.25 0 0 1 19.25 10h5.5A2.25 2.25 0 0 1 27 12.25v4.5A2.25 2.25 0 0 1 24.75 19h-.9L21 21.5V19h-1.75A2.25 2.25 0 0 1 17 16.75v-4.5Z" />
    </svg>
  );
}

export function HeroContactLink() {
  // A mailto: link does nothing at all on a desktop without a mail app registered,
  // so those visitors get Gmail's compose window instead. Touch devices always have
  // a mail app, and the href stays a mailto: for them (and for right-click → copy).
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    event.preventDefault();
    window.open(GMAIL_COMPOSE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <a
      className="hero__social-link hero__social-link--contact"
      href={`mailto:${CONTACT_EMAIL}`}
      onClick={onClick}
      aria-label="Envoyer un e-mail au club"
    >
      <ContactIcon />
    </a>
  );
}
