import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['account'].title + ' | AJStreams',
    description: footerPages['account'].intro,
};

export default function Page() {
    return <InfoPage slug="account" />;
}
