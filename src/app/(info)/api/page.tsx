import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['api'].title + ' | AJStreams',
    description: footerPages['api'].intro,
};

export default function Page() {
    return <InfoPage slug="api" />;
}
