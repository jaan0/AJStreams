import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['terms'].title + ' | AJStreams',
    description: footerPages['terms'].intro,
};

export default function Page() {
    return <InfoPage slug="terms" />;
}
