import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['privacy'].title + ' | AJStreams',
    description: footerPages['privacy'].intro,
};

export default function Page() {
    return <InfoPage slug="privacy" />;
}
