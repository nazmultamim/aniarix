import { getCanonicalUrl, siteConfig } from '@/lib/site-config';
import Link from 'next/link';

export const metadata = {
  title: 'About',
  description: siteConfig.description,
  alternates: {
    canonical: getCanonicalUrl('/about'),
  },
};



function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-3 mb-4">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-500 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
        {title}
      </h2>
      <div className="text-sm md:text-base text-gray-300/90 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

function List({ items }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-gray-300/90">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-black text-white mb-3">
          About AniArix
        </h1>
        <p className="text-base text-gray-300/90 leading-relaxed mb-10">
          Welcome to <strong className="text-white">AniArix</strong>, your destination for
          discovering and streaming anime in a fast, clean, and premium experience. Our goal is
          simple: make it easy for anime fans to find their favorite series, watch episodes
          without unnecessary distractions, and enjoy a modern interface built specifically for
          the anime community.
        </p>

        <Section title="Extensive Anime Library">
          <p>
            Discover thousands of anime across every genre, including Action, Adventure, Romance,
            Fantasy, Comedy, Slice of Life, Horror, Sci-Fi, Sports, Mystery, Thriller, Isekai, and
            more. Browse trending series, timeless classics, seasonal releases, and top-rated
            titles with ease.
          </p>
        </Section>

        <Section title="High-Quality Streaming">
          <p>
            Watch your favorite anime in multiple video qualities based on availability from the
            streaming provider, including:
          </p>
          <List items={['1080p Full HD', '720p HD', '480p SD']} />
          <p className="text-xs text-muted-foreground/50 mt-3">
            Available resolutions may vary depending on the selected title and streaming source.
          </p>
        </Section>

        <Section title="Multiple Language Options">
          <p>Many anime support multiple language versions, including:</p>
          <List items={['Japanese Audio with English Subtitles', 'English Dub']} />
          <p className="text-xs text-muted-foreground/50 mt-3">
            Available language options depend on the streaming provider and the specific anime.
          </p>
        </Section>

        <Section title="No Registration Required">
          <p>
            AniArix lets you start watching instantly. Browse the anime library, explore detailed
            information, and stream episodes without creating an account. Simply search for your
            favorite anime, choose an episode, and start watching.
          </p>
        </Section>

        <Section title="Personalized Features">
          <p>
            Creating a free AniArix account unlocks additional features designed to personalize
            your experience.
          </p>
          <p className="font-semibold text-white/90">Registered users can:</p>
          <List
            items={[
              'Save favorite anime',
              'View and manage watch history',
              'Sync their personal library across devices',
              'Access future account-based features',
            ]}
          />
          <p className="mt-3">
            Streaming and browsing remain completely available without registration.
          </p>
        </Section>

        <Section title="Features">
          <p>
            AniArix offers a growing collection of features designed to provide a fast, modern,
            and enjoyable anime streaming experience.
          </p>
          <List
            items={[
              'Powerful anime search',
              'Browse by genre',
              'Top-rated anime',
              'Trending anime',
              'Seasonal anime',
              'Recently released anime',
              'Detailed anime information',
              'Reliable streaming via a trusted provider',
              'Multiple video quality options (provider-dependent)',
              'Subbed and dubbed streaming (when available)',
              'Favorite anime collection (Account Required)',
              'Watch history (Account Required)',
              'Responsive design',
              'Dark mode optimized interface',
              'Mobile-friendly experience',
              'Fast loading with intelligent caching',
            ]}
          />
        </Section>

        <Section title="How to Watch Anime">
          <p>Watching anime on AniArix is quick and easy.</p>
          <ol className="list-decimal list-inside space-y-1.5 mt-2 text-gray-300/90">
            <li>Search for an anime or browse by genre, season, or popularity.</li>
            <li>Open the anime details page.</li>
            <li>Select the episode you want to watch.</li>
            <li>Choose your preferred language if multiple versions are available.</li>
            <li>Press Watch Now and enjoy your anime.</li>
          </ol>
          <p className="mt-3">
            You do not need an account to stream anime. Creating an account is only required for
            saving favorites and watch history.
          </p>
        </Section>

        <Section title="Anime Information">
          <p>
            AniArix uses anime metadata provided by the{' '}
            <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
              AniLst
            </a>{' '}
           to deliver accurate and up-to-date
            information, including:
          </p>
          <List
            items={[
              'English titles',
              'Japanese titles',
              'High-quality posters',
              'Synopsis',
              'Genres',
              'Episode count',
              'Ratings and scores',
              'Trailers',
              'Season and release information',
              'Anime status',
              'Duration',
              'Format',
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground/50">
            Supplementary episode information during playback may also be sourced from AniList.
          </p>
          <p className="mt-3">
            This information helps users discover anime and make informed viewing choices.
          </p>
        </Section>

        <Section title="Streaming">
          <p>AniArix does not host video files on its own servers.</p>
          <p>
            Video playback is provided through a trusted third-party streaming provider.
            Availability, video quality, language options, and playback performance may vary
            depending on the selected anime and episode.
          </p>
        </Section>

        <Section title="Device Compatibility">
          <p>AniArix is fully responsive and optimized for all modern devices, including:</p>
          <List
            items={[
              'Desktop computers',
              'Laptops',
              'Android smartphones',
              'iPhones',
              'Tablets',
              'Smart TVs with modern web browsers',
            ]}
          />
          <p className="mt-3">
            For the best experience, we recommend using the latest versions of Chrome, Firefox,
            Edge, or Safari.
          </p>
        </Section>

        <Section title="Privacy">
          <p>Your privacy is important to us.</p>
          <p>AniArix does not require an account to browse or stream anime.</p>
          <p>
            If you choose to create an account, your personal data is limited to features such as
            Favorites and Watch History. This information is securely associated with your
            account and is never shared publicly. We only collect the information necessary to
            provide these personalized features.
          </p>
        </Section>

        <Section title="Copyright">
          <p>AniArix respects the rights of copyright holders.</p>
          <p>
            We do not claim ownership of anime titles, artwork, trademarks, or other intellectual
            property displayed on the platform. Anime information is provided by the AniList
          , while streaming content is delivered through a third-party
            provider.
          </p>
        </Section>

        <Section title="Frequently Asked Questions">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-white/90">Is AniArix free?</p>
              <p>Yes. AniArix is completely free to browse and stream.</p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Do I need an account?</p>
              <p>No. You can browse the anime library and stream episodes without registering.</p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Why should I create an account?</p>
              <p>
                Creating an account allows you to save your favorite anime, access your watch
                history, and synchronize your personalized library across devices.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Where does the anime information come from?</p>
              <p>
                Anime details, ratings, genres, and other metadata are provided by the Jikan API
                (built on MyAnimeList data).
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Can I watch anime on my phone?</p>
              <p>Yes. AniArix is fully optimized for smartphones, tablets, laptops, and desktop computers.</p>
            </div>
          </div>
        </Section>

        <Section title="Our Mission">
          <p>
            Our mission is to build one of the fastest, cleanest, and most enjoyable anime
            streaming platforms on the web.
          </p>
          <p>
            AniArix focuses on performance, simplicity, elegant design, and effortless anime
            discovery. We continuously improve the platform by enhancing speed, expanding
            features, refining the user experience, and delivering a premium environment where
            anime fans can enjoy their favorite series without unnecessary complexity.
          </p>
        </Section>

        <Section title="Changes to the Service">
          <p>
            AniArix may update, improve, or modify features and services at any time to enhance
            the overall user experience. Significant platform updates may be announced through
            the website when appropriate.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>Questions, suggestions, or feedback? We&apos;d love to hear from you.</p>
          <p>
            If you encounter an issue, have a feature request, or want to help improve AniArix,
            please contact us through our Contact page. Community feedback plays an important
            role in helping us build a better platform for anime fans around the world.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-white/[0.06] text-center">
          <p className="text-white font-semibold mb-1">Thank you for being part of the AniArix community.</p>
          <p className="text-sm text-muted-foreground/60">
            Welcome to AniArix — Stream More. Discover More. Enjoy More.
          </p>
        </div>
      </div>
    </div>
  );
}