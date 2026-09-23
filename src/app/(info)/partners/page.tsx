import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['partners'].title + ' | AJStreams',
    description: footerPages['partners'].intro,
};

export default function Page() {
    return <InfoPage slug="partners" />;
}
