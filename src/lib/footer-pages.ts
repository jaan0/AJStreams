export type InfoSection = { title: string; text: string; href?: string; link?: string };
export type InfoPage = {
    title: string;
    category: 'Company' | 'Support' | 'Legal' | 'Resources';
    intro: string;
    sections: InfoSection[];
    notice?: string;
};

export const footerPages: Record<string, InfoPage> = {
    about: {
        title: 'About Us', category: 'Company', intro: 'Your next movie night starts here.',
        sections: [
            { title: 'Welcome to AJStreams', text: 'Explore movies and TV shows in one place, discover something new, and return to the stories you love.', href: '/movies', link: 'Explore movies' },
            { title: 'Make it your own', text: 'Sign in to save favorites to My List and keep your next watch close at hand.', href: '/account', link: 'Your account' },
            { title: 'Watch together', text: 'Share the experience with watch parties, synchronized playback, and conversation alongside the action.', href: '/watch-parties', link: 'Explore watch parties' },
        ],
    },
    careers: {
        title: 'Careers', category: 'Company', intro: 'Help shape a better movie night.',
        notice: 'There are no published job openings on this site yet.',
        sections: [
            { title: 'What we build', text: 'AJStreams brings discovery, personal watchlists, and shared viewing into a single experience.' },
            { title: 'Areas of interest', text: 'Product design, accessible interfaces, and reliable playback are central to the experience. Future role announcements will appear here.' },
            { title: 'Stay connected', text: 'Visit the blog for product guides and return here for future career updates.', href: '/blog', link: 'Read the blog' },
        ],
    },
    press: {
        title: 'Press', category: 'Company', intro: 'A quick introduction to AJStreams.',
        sections: [
            { title: 'At a glance', text: 'AJStreams is a web experience for exploring movies and TV shows, saving favorites, and joining watch parties.' },
            { title: 'Brand and attribution', text: 'Use the name AJStreams when referring to this project. Movie artwork and third-party marks belong to their respective owners.', href: '/licenses', link: 'View attribution notes' },
            { title: 'Media inquiries', text: 'A dedicated press inbox and downloadable media kit have not been published. See the contact page for the available contact route.', href: '/contact', link: 'Contact information' },
        ],
    },
    blog: {
        title: 'Blog', category: 'Company', intro: 'Small guides for a great night in.',
        sections: [
            { title: 'Build your next-watch list', text: 'Find a title you like, sign in, and use its favorite control. Open My List whenever you want to return to your saved picks.', href: '/my-list', link: 'Open My List' },
            { title: 'Bring friends to movie night', text: 'Sign in and explore Watch Parties. Share a party invitation with your friends so they can join the same viewing session.', href: '/watch-parties', link: 'Find a watch party' },
            { title: 'When playback needs a little help', text: 'Try another available server, reload the player, and check your connection. Our help center has more troubleshooting steps.', href: '/help', link: 'Read playback tips' },
        ],
    },
    help: {
        title: 'Help Center', category: 'Support', intro: 'Get back to watching with a little help.',
        sections: [
            { title: 'Getting started', text: 'Browse Movies or use the search button in the navigation to find a title. Open its details to start watching.', href: '/movies', link: 'Browse movies' },
            { title: 'Playback and buffering', text: 'Check your connection, refresh the page, or choose another available streaming server. Try an updated browser if the player still does not load.' },
            { title: 'Signing in', text: 'Use the email and password you registered with. If you are new, open Sign in and switch to the registration option.', href: '/account', link: 'Open your account' },
            { title: 'Watch parties', text: 'Sign in before creating or joining a party. If a shared invitation no longer works, ask the host for a current link.', href: '/watch-parties', link: 'Open watch parties' },
            { title: 'More questions', text: 'Find quick answers about favorites, account settings, and streaming availability.', href: '/faq', link: 'Read the FAQ' },
        ],
    },
    contact: {
        title: 'Contact Us', category: 'Support', intro: 'Find the right next step.',
        notice: 'A dedicated support inbox is not configured. The creator website below is the contact route linked by this project.',
        sections: [
            { title: 'Help with watching', text: 'For playback or account questions, start with the troubleshooting guides and frequently asked questions.', href: '/help', link: 'Visit the help center' },
            { title: 'Reach the creator', text: 'Visit AJ’s website for the contact options published there. Include the page URL, your browser, and a short description of the issue. Never send your password.', href: 'https://aj-bay.vercel.app', link: 'Visit AJ’s website' },
            { title: 'Content and rights inquiries', text: 'Include the title, affected URL, and a description of your concern when contacting the creator. A dedicated rights-request workflow has not been published.' },
        ],
    },
    faq: {
        title: 'FAQ', category: 'Support', intro: 'A few answers before you press play.',
        sections: [
            { title: 'Do I need an account?', text: 'You can browse the catalog without signing in. Personal features such as favorites and watch parties use your account.' },
            { title: 'Where are my saved movies?', text: 'Sign in and open My List from the navigation to see your saved favorites.', href: '/my-list', link: 'Go to My List' },
            { title: 'Why is a video not playing?', text: 'Availability depends on the title and streaming provider. Try another available server or refresh the page. See the help center for more steps.', href: '/help', link: 'Playback help' },
            { title: 'Can I change my password here?', text: 'The current profile page does not yet offer password changes or a self-service password reset. Do not share your password with anyone.' },
            { title: 'How do watch parties work?', text: 'Watch parties combine a shared viewing session with chat. Sign in, open Watch Parties, and use a current invitation to join friends.', href: '/watch-parties', link: 'Explore parties' },
        ],
    },
    account: { title: 'Account', category: 'Support', intro: 'Your profile, your favorites, your movie nights.', sections: [] },
    privacy: {
        title: 'Privacy Policy', category: 'Legal', intro: 'Understand the information behind your experience.',
        notice: 'Draft information page. The site operator must confirm its privacy policy, retention periods, contact details, and applicable rights before publishing a final policy.',
        sections: [
            { title: 'Account information', text: 'Account features use registration information such as your name and email, along with authentication credentials. Saved favorites are associated with your account.' },
            { title: 'Connected services', text: 'The app integrates external services for features such as movie metadata, media, and watch-party communication. External players and linked websites may process information under their own policies.' },
            { title: 'Browser storage', text: 'The app uses browser storage for preferences such as your selected streaming server and whether you dismissed the install banner.', href: '/cookies', link: 'Read storage notes' },
            { title: 'Questions about your information', text: 'The operator has not yet published a dedicated privacy request process or retention schedule. See the contact page for the available contact route.', href: '/contact', link: 'Contact information' },
        ],
    },
    terms: {
        title: 'Terms of Service', category: 'Legal', intro: 'A place for clear expectations.',
        notice: 'Draft information page, not finalized service terms. The operator must supply and approve the governing terms before publication.',
        sections: [
            { title: 'Using AJStreams', text: 'AJStreams provides catalog browsing, account features, and viewing tools. Feature and title availability can vary with the services that power them.' },
            { title: 'Accounts and community', text: 'Keep your sign-in details private. Use shared viewing and chat respectfully, and do not attempt to access another person’s account.' },
            { title: 'Third-party content', text: 'Linked and embedded services operate independently. This page does not grant rights to movie artwork, videos, trademarks, or other third-party materials.' },
            { title: 'Terms still to be finalized', text: 'Eligibility, jurisdiction, dispute handling, service commitments, and other contractual details have not been supplied by the operator.', href: '/contact', link: 'Contact information' },
        ],
    },
    cookies: {
        title: 'Cookie Policy', category: 'Legal', intro: 'The small details your browser remembers.',
        notice: 'Draft storage overview. The operator must verify production cookies and third-party storage before finalizing this policy.',
        sections: [
            { title: 'Sign-in cookies', text: 'The app uses NextAuth for authentication. Authentication cookies support session and sign-in security; their exact names and behavior depend on the deployment configuration.' },
            { title: 'Local preferences', text: 'The local storage key ajstreams_stream_server remembers the selected streaming server. The key ajstreams_pwa_dismissed remembers dismissal of the install prompt.' },
            { title: 'Managing browser storage', text: 'You can remove this site’s cookies and local storage in your browser settings. Doing so may sign you out and reset saved device preferences.' },
            { title: 'Embedded services', text: 'External video players may use their own cookies or storage. Consult the provider’s policy for details.', href: '/privacy', link: 'Privacy overview' },
        ],
    },
    licenses: {
        title: 'Licenses', category: 'Legal', intro: 'Recognizing the tools and content behind the experience.',
        notice: 'Attribution overview. A complete dependency license inventory and content permissions must be verified before distribution.',
        sections: [
            { title: 'Open-source software', text: 'This project uses Next.js, React, Tailwind CSS, Framer Motion, React Feather, and other packages. Each dependency retains its own license and notices.' },
            { title: 'Movie information and artwork', text: 'The project integrates TMDB for movie and television metadata. Artwork and other third-party materials remain subject to their respective rights and attribution requirements.' },
            { title: 'Streaming content', text: 'A software license does not grant permission to distribute movies or television shows. Content permissions are separate from the application’s source code.' },
            { title: 'Attribution questions', text: 'For missing attribution or a rights concern, include the affected title or page when contacting the creator.', href: '/contact', link: 'Contact information' },
        ],
    },
    api: {
        title: 'API', category: 'Resources', intro: 'A look at the routes powering AJStreams.',
        notice: 'These are application endpoints, not a supported public developer API. No public API key program or stability guarantee is published.',
        sections: [
            { title: 'GET /api/movies', text: 'Returns the catalog as a JSON array, ordered by creation date. The service requires a configured database.' },
            { title: 'GET /api/movies/search?q=…', text: 'Searches titles, genres, and descriptions. Returns up to ten matches; an empty query returns an empty array.' },
            { title: 'GET /api/user/favorites', text: 'Returns favorites for the signed-in user. A valid session is required; unauthenticated requests receive a 401 response.' },
            { title: 'Building with the project', text: 'Keep database credentials and service secrets on the server. Review the developer overview before extending the application.', href: '/developers', link: 'Developer overview' },
        ],
    },
    developers: {
        title: 'Developers', category: 'Resources', intro: 'Build on a familiar web stack.',
        sections: [
            { title: 'The stack', text: 'AJStreams uses the Next.js App Router, React, TypeScript, and Tailwind CSS. Shared components provide navigation, authentication, and the player experience.' },
            { title: 'Run locally', text: 'Install the project dependencies with npm install, configure your own environment variables, and run npm run dev. Use npm run build to check a production build.' },
            { title: 'Service integrations', text: 'Account and catalog features use MongoDB. Other integrations include TMDB, Cloudinary, and Pusher. Configure your own credentials and keep secrets out of browser code and source control.' },
            { title: 'Explore the endpoints', text: 'Read the API overview for selected routes and session requirements.', href: '/api', link: 'View API overview' },
        ],
    },
    partners: {
        title: 'Partners', category: 'Resources', intro: 'Good experiences start with collaboration.',
        notice: 'No formal partnership program or partner directory has been announced.',
        sections: [
            { title: 'Potential collaborations', text: 'Ideas around discovery, accessible viewing, and community experiences can be discussed with the project creator.' },
            { title: 'Start with an introduction', text: 'Describe your organization, your proposal, and any content rights or technical requirements involved.', href: '/contact', link: 'Find contact details' },
        ],
    },
    affiliates: {
        title: 'Affiliates', category: 'Resources', intro: 'Share your interest in AJStreams.',
        notice: 'An affiliate program is not currently published. There are no published commission rates, referral rewards, or enrollment terms.',
        sections: [
            { title: 'Share the experience', text: 'You can share a link to AJStreams with friends. Ordinary links are not tracked as paid affiliate referrals.' },
            { title: 'Future program updates', text: 'If an affiliate program is introduced, its eligibility, disclosures, and payment terms will need to be published here.' },
            { title: 'Have a collaboration idea?', text: 'See the partnerships page for information about introducing a proposal.', href: '/partners', link: 'Explore partnerships' },
        ],
    },
};
