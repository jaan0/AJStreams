import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['developers'].title + ' | AJStreams',
    description: footerPages['developers'].intro,
};

export default function Page() {
    return <InfoPage slug="developers" />;
}
