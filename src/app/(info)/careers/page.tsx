import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['careers'].title + ' | AJStreams',
    description: footerPages['careers'].intro,
};

export default function Page() {
    return <InfoPage slug="careers" />;
}
