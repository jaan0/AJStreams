import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['about'].title + ' | AJStreams',
    description: footerPages['about'].intro,
};

export default function Page() {
    return <InfoPage slug="about" />;
}
