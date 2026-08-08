import { getCanonicalUrl, siteConfig } from '@/lib/site-config';

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
          instantly without mandatory sign-ups, and enjoy enhanced personalized features when logged in.
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

        <Section title="100% Free & Guest Friendly">
          <p>
            AniArix lets you start watching instantly without sign-ups or registration. Browse the
            anime library, explore detailed information, and stream episodes freely as a guest. 
            Creating an optional account unlocks personalized perks to elevate your experience.
          </p>
        </Section>

        <Section title="Features">
          <p>
            AniArix offers a growing collection of features designed to provide a fast, modern,
            and enjoyable anime streaming experience.
          </p>
          <List
            items={[
              'Instant guest streaming (no signup required)',
              'Continue Watching progress (with account)',
              'AniList account synchronization',
              'Custom watchlists & bookmarks',
              'Powerful anime search',
              'Browse by genre & popularity',
              'Top-rated & seasonal anime',
              'Detailed metadata & summaries',
              'Reliable streaming via trusted providers',
              'Multiple video quality options',
              'Subbed and dubbed streaming',
              'Responsive & dark-mode design',
              'Mobile-friendly experience',
            ]}
          />
        </Section>

        <Section title="How to Watch Anime">
          <p>Watching anime on AniArix is quick and easy.</p>
          <ol className="list-decimal list-inside space-y-1.5 mt-2 text-gray-300/90">
            <li>Search for an anime or browse by genre, season, or popularity.</li>
            <li>Open the anime details page.</li>
            <li>Select the episode you want to watch.</li>
            <li>Choose your preferred language option (Sub/Dub) if available.</li>
            <li>Press Watch Now and enjoy your anime immediately—or log in to sync your progress!</li>
          </ol>
        </Section>

        <Section title="Anime Information">
          <p>
            AniArix uses metadata provided by{' '}
            <a
              href="https://anilist.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
            >
              AniList
            </a>{' '}
            to deliver accurate and up-to-date information, including:
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
        </Section>

        <Section title="Streaming">
          <p>AniArix does not host video files on its own servers.</p>
          <p>
            Video playback is provided through trusted third-party streaming providers.
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
        </Section>

        <Section title="Privacy & Account Data">
          <p>Your privacy is important to us.</p>
          <p>
            AniArix does not require any account creation or personal information to browse or stream anime.
            If you choose to create an account to access features like Continue Watching and AniList synchronization,
            your data is securely processed and used solely to enhance your personalized experience.
          </p>
        </Section>

        <Section title="Copyright">
          <p>AniArix respects the rights of copyright holders.</p>
          <p>
            We do not claim ownership of anime titles, artwork, trademarks, or other intellectual
            property displayed on the platform. Anime information is provided by AniList, while
            streaming content is delivered through third-party providers.
          </p>
        </Section>

        <Section title="Frequently Asked Questions">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-white/90">Is AniArix free?</p>
              <p>Yes. AniArix is completely free to browse and stream.</p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Do I need an account to watch?</p>
              <p>
                No. You can stream any anime without registering. However, signing up unlocks
                extra features like Continue Watching and AniList synchronization.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90">What are the benefits of signing up?</p>
              <p>
                Creating a free account lets you sync your watch progress with AniList, save your watch history with Continue Watching, and maintain a personalized list across devices.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Where does the anime information come from?</p>
              <p>
                Anime details, ratings, genres, and metadata are provided by public anime APIs
                like AniList.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90">Can I watch anime on my mobile device?</p>
              <p>
                Yes. AniArix is fully optimized for smartphones, tablets, laptops, and desktop
                computers.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Our Mission">
          <p>
            Our mission is to build one of the fastest, cleanest, and most hassle-free anime
            streaming platforms on the web.
          </p>
          <p>
            AniArix focuses on performance, simplicity, elegant design, and effortless anime
            discovery. We continuously improve the platform so anime fans can enjoy their favorite
            series without unnecessary complexity.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>Questions, suggestions, or feedback? We&apos;d love to hear from you. </p>
          <p>
            If you encounter an issue, have a feature request, or want to help improve AniArix,
            please contact us through our{' '}
            <a href="/contact" className="text-orange-400 font-semibold hover:underline">
              Contact page
            </a>.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-white/[0.06] text-center">
          <p className="text-white font-semibold mb-1">
            Thank you for being part of the AniArix community.
          </p>
          <p className="text-sm text-muted-foreground/60">
            Welcome to AniArix — Stream More. Discover More. Enjoy More.
          </p>
        </div>
      </div>
    </div>
  );
}