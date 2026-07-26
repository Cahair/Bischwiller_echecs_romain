import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { sponsors } from "@/lib/sponsors";
import styles from "./sponsor-band.module.css";

export function SponsorBand() {
  return <section className={styles.band} aria-labelledby="sponsor-band-title">
    <div className={styles.heading}>
      <span>Ils nous soutiennent</span>
      <h2 id="sponsor-band-title">Merci à nos partenaires.</h2>
      <Link href="/partenaires">Découvrir nos partenaires <b>→</b></Link>
    </div>
    <ul className={styles.logos}>{sponsors.map((sponsor) => <li key={sponsor.name} style={{ "--logo-scale": sponsor.scale ?? 1 } as CSSProperties}>
      <Link href="/partenaires" aria-label={`${sponsor.name} — voir la page Partenaires`}>
        <Image src={sponsor.logo} alt={sponsor.name} width={200} height={100} sizes="(max-width: 700px) 40vw, (max-width: 1100px) 22vw, 170px" />
      </Link>
    </li>)}</ul>
  </section>;
}
