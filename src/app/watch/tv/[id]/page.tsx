import { redirect } from 'next/navigation';

export default function TvWatchRedirect({
    params,
}: {
    params: { id: string };
}) {
    redirect(`/watch/tv/${params.id}/1/1`);
}
