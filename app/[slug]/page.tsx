import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/pages/content-page";
import { getSitePage, sitePages } from "@/lib/site-pages";

export function generateStaticParams() {
  return sitePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getSitePage(slug);
  return page ? { title: `${page.title} - Cercle d'Échecs de Bischwiller`, description: page.intro } : {};
}

export default async function StaticContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getSitePage(slug);
  if (!page) notFound();
  return <ContentPage page={page} />;
}
