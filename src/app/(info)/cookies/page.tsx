import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['cookies'].title + ' | AJStreams',
    description: footerPages['cookies'].intro,
};

export default function Page() {
    return <InfoPage slug="cookies" />;
}
