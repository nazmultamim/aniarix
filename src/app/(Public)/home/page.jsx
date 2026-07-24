import { Hhomeimgeslider } from '@/components/layout/ImageSlider';
import PublicHomePage from '@/components/layout/PublicHomePage';
import { getCanonicalUrl, siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Home',
  description: siteConfig.description,
  alternates: {
    canonical: getCanonicalUrl('/home'),
  },
};

function Home() {
  return (
    <div> 
      <Hhomeimgeslider />
      <PublicHomePage />
    </div>
  )
}

export default Home
