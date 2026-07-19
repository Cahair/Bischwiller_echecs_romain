import type { Metadata } from "next";
import { InfosPratiquesPage } from "@/components/pages/infos-pratiques-page";

export const metadata: Metadata = {
  title: "Infos Pratiques - Cercle d'Échecs de Bischwiller",
  description: "Adresse, horaires et contact : l'essentiel pour venir jouer au Cercle d'Échecs de Bischwiller.",
};

export default function Page() {
  return <InfosPratiquesPage />;
}
