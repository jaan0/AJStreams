import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['affiliates'].title + ' | AJStreams',
    description: footerPages['affiliates'].intro,
};

export default function Page() {
    return <InfoPage slug="affiliates" />;
}
