import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
        redirect('/');
    }

    return <AdminDashboardClient />;
}
