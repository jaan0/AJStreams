import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { footerPages } from '@/lib/footer-pages';

export const metadata: Metadata = {
    title: footerPages['help'].title + ' | AJStreams',
    description: footerPages['help'].intro,
};

export default function Page() {
    return <InfoPage slug="help" />;
}
