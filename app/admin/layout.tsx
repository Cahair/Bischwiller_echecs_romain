import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "@/components/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Espace admin",
  // Ces pages ne doivent apparaître dans aucun moteur de recherche.
  robots: { index: false, follow: false, nocache: true },
};

// Rien ici ne doit être mis en cache : l’espace admin lit le disque, qui
// change au fil des publications.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
