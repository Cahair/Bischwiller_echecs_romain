import { HeroContactLink } from "./hero-contact-link";

const FACEBOOK_URL = "https://www.facebook.com/Cercle.Echecs.Bischwiller/?locale=fr_FR";

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

        <HeroContactLink />
      </nav>
    </section>
  );
}
