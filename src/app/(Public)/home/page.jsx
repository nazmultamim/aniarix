import { Hhomeimgeslider } from '@/components/layout/ImageSlider';
import PublicHomePage from '@/components/layout/PublicHomePage';
import TrendingAnimeSection from '@/components/layout/TrendingAnimeSection';
import { getHeroAnimeSlidesAction } from '@/lib/action/Getanimeaction';
import { getCanonicalUrl, siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Home',
  description: siteConfig.description,
  alternates: {
    canonical: getCanonicalUrl('/home'),
  },
};

async function Home() {
  let heroSlides = [];

  try {
    const result = await getHeroAnimeSlidesAction();
    heroSlides = Array.isArray(result?.items) ? result.items : [];
  } catch (err) {
    console.error('[Home] failed to load hero slides:', err);
  }

  return (
    <div> 
      <Hhomeimgeslider initialSlides={heroSlides} />
      <TrendingAnimeSection limit={12} />
      <PublicHomePage />
    </div>
  )
}

export default Home
