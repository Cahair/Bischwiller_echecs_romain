import type { Metadata } from "next";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource/yatra-one/400.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bischwiller-echecs.com"),
  title: {
    default: "Cercle d'Échecs de Bischwiller",
    template: "%s — C.E. Bischwiller",
  },
  description:
    "Le site officiel du Cercle d'Échecs de Bischwiller, un club animé par la passion du jeu depuis 1981.",
  openGraph: {
    title: "Cercle d'Échecs de Bischwiller",
    description: "Penser. Jouer. Transmettre. Le club d'échecs de Bischwiller depuis 1981.",
    locale: "fr_FR",
    type: "website",
    siteName: "C.E. Bischwiller",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
