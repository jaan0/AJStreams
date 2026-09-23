import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['blog'].title + ' | AJStreams',
    description: footerPages['blog'].intro,
};

export default function Page() {
    return <InfoPage slug="blog" />;
}
