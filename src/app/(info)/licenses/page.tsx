import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['licenses'].title + ' | AJStreams',
    description: footerPages['licenses'].intro,
};

export default function Page() {
    return <InfoPage slug="licenses" />;
}
