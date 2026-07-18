"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./site-header.module.css";

const navigation = [
  { label: "Le Club", href: "/le-club", children: [["Notre histoire", "/un-peu-dhistoire"], ["Palmarès", "/palmares"], ["Scolaire", "/scolaire"], ["Partenaires", "/partenaires"]] },
  { label: "Actualités", href: "/actualites" },
  { label: "Infos pratiques", href: "/infos-pratiques", children: [["Horaires", "/horraires"], ["Administratif", "/administratif"], ["Documents", "/documents"]] },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = !isHome || scrolled || menuOpen;
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className={`${styles.header} ${visible ? styles.visible : ""}`}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="Accueil du Cercle d’Échecs de Bischwiller">
          <Image src="/media/wordpress/2025/06/images.webp" alt="" width={42} height={42} />
          <span><strong>C.E.</strong> Bischwiller</span>
        </Link>
        <button className={`${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ""}`} type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}><span /><span /><span className={styles.srOnly}>Ouvrir le menu</span></button>
        <nav id="site-navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Navigation principale" onClick={() => setMenuOpen(false)}>
          {navigation.map((item) => <div className={styles.navGroup} key={item.href}>
            <Link className={isActive(item.href) ? styles.active : ""} href={item.href}>{item.label}</Link>
            {item.children ? <div className={styles.submenu}>{item.children.map(([label, href]) => <Link className={isActive(href) ? styles.active : ""} href={href} key={href}>{label}<span>↗</span></Link>)}</div> : null}
          </div>)}
          <Link className={styles.mobileCta} href="/#inscriptions">S’inscrire</Link>
        </nav>
        <Link className={styles.cta} href="/#inscriptions">S’inscrire <span>↗</span></Link>
      </div>
    </header>
  );
}
