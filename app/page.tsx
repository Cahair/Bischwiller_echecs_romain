import { Hero } from "@/components/home/hero/hero";
import { HomeSections } from "@/components/home/sections/home-sections";
import { SiteFooter } from "@/components/layout/site-footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <HomeSections />
      <SiteFooter />
    </main>
  );
}
