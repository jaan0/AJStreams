import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['contact'].title + ' | AJStreams',
    description: footerPages['contact'].intro,
};

export default function Page() {
    return <InfoPage slug="contact" />;
}
