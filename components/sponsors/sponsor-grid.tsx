import Image from "next/image";
import type { CSSProperties } from "react";
import type { Sponsor } from "@/lib/sponsors";
import styles from "./sponsor-grid.module.css";

export function SponsorGrid({ sponsors }: { sponsors: Sponsor[] }) {
  return <ul className={styles.grid}>{sponsors.map((sponsor) => {
    const style = { "--logo-scale": sponsor.scale ?? 1 } as CSSProperties;
    const logo = <Image src={sponsor.logo} alt={sponsor.name} width={260} height={130} quality={90} sizes="(max-width: 700px) 45vw, (max-width: 1000px) 30vw, 220px" />;
    return <li key={sponsor.name} style={style}>
      {sponsor.href
        ? <a className={styles.card} href={sponsor.href} target="_blank" rel="noreferrer">{logo}<b aria-hidden="true">↗</b></a>
        : <div className={styles.card}>{logo}</div>}
    </li>;
  })}</ul>;
}
