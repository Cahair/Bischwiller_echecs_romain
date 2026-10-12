import Script from "next/script";

// Mesure d'audience Umami : sans cookie, sans donnée personnelle conservée.
// Les deux valeurs sont lues au build (pages statiques) : sans identifiant de
// site, rien n'est chargé — en développement notamment.
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";

// Seuls ces noms d'hôte sont comptés : un `pnpm start` lancé en local avec le
// .env de production ne pollue pas les statistiques.
const domains = "bischwiller-echecs.com,www.bischwiller-echecs.com";

// Appelée par le traceur avant chaque envoi ; renvoyer null l'annule. L'espace
// admin n'est jamais compté, y compris quand on y entre par un lien interne
// (le traceur suit alors la navigation sans recharger la page).
const beforeSend = `window.umamiBeforeSend = function (type, payload) {
  var path = new URL(payload.url || "/", location.origin).pathname;
  return path === "/admin" || path.indexOf("/admin/") === 0 ? null : payload;
};`;

export function UmamiAnalytics() {
  if (!websiteId) return null;

  return (
    <>
      <Script id="umami-before-send" strategy="beforeInteractive">
        {beforeSend}
      </Script>
      <Script
        src={scriptUrl}
        strategy="afterInteractive"
        data-website-id={websiteId}
        data-domains={domains}
        data-before-send="umamiBeforeSend"
        data-do-not-track="true"
      />
    </>
  );
}
