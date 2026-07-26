const FACEBOOK_URL = "https://www.facebook.com/Cercle.Echecs.Bischwiller/?locale=fr_FR";
const CONTACT_EMAIL = "bischwiller.echecs1981@gmail.com";

function FacebookIcon() {
  return (
    <svg className="facebook-mark" aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path
        className="facebook-mark__letter"
        d="M13.35 21v-8h2.7l.4-3.12h-3.1v-2c0-.9.25-1.52 1.58-1.52h1.69V3.57a23 23 0 0 0-2.46-.13c-2.43 0-4.1 1.49-4.1 4.22v2.22H7.3V13h2.75v8h3.3Z"
      />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 24">
      <path d="M3 5.25A2.25 2.25 0 0 1 5.25 3h12.5A2.25 2.25 0 0 1 20 5.25v9.5A2.25 2.25 0 0 1 17.75 17H5.25A2.25 2.25 0 0 1 3 14.75v-9.5Zm2.1.25 6.4 4.8 6.4-4.8H5.1Zm12.9 2-5.9 4.42a1 1 0 0 1-1.2 0L5 7.5v7.25c0 .14.11.25.25.25h12.5a.25.25 0 0 0 .25-.25V7.5Z" />
      <path d="M17 12.25A2.25 2.25 0 0 1 19.25 10h5.5A2.25 2.25 0 0 1 27 12.25v4.5A2.25 2.25 0 0 1 24.75 19h-.9L21 21.5V19h-1.75A2.25 2.25 0 0 1 17 16.75v-4.5Z" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <video
        className="hero__video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/videos/hero-chess-poster.jpg"
        aria-hidden="true"
      >
        <source src="/videos/hero-chess.mp4" type="video/mp4" />
      </video>

      <div className="hero__shade" aria-hidden="true" />

      <h1 id="hero-title" className="hero__title">
        <span>Cercle</span>
        <span>d&apos;échecs de</span>
        <span>Bischwiller</span>
      </h1>

      <p
        className="hero__tagline"
        aria-label="45 ans de passion, de formations et de titres"
      >
        <span>45 ans de</span>
        <span className="hero__word-rotator" aria-hidden="true">
          <em className="hero__word">passion</em>
          <em className="hero__word">formations</em>
          <em className="hero__word">titres</em>
        </span>
      </p>

      <nav className="hero__links" aria-label="Liens du club">
        <a
          className="hero__social-link hero__social-link--facebook"
          href={FACEBOOK_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Retrouvez le club sur Facebook"
        >
          <FacebookIcon />
        </a>

        <a
          className="hero__social-link hero__social-link--contact"
          href={`mailto:${CONTACT_EMAIL}`}
          aria-label="Envoyer un e-mail au club"
        >
          <ContactIcon />
        </a>
      </nav>
    </section>
  );
}
