import Link from 'next/link';
import { ArrowLeft, ArrowRight, Film } from 'react-feather';
import Footer from '@/components/Footer';
import { footerPages } from '@/lib/footer-pages';
import AccountPanel from '@/components/AccountPanel';
import AnalyticsPreference from '@/components/AnalyticsPreference';

export default function InfoPage({ slug }: { slug: string }) {
    const page = footerPages[slug];
    const related = Object.entries(footerPages).filter(([key, item]) => key !== slug && item.category === page.category);

    return (
        <div className="info-page relative overflow-hidden bg-primary-bg">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-12 md:py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
                    <ArrowLeft size={16} aria-hidden="true" /> Back to home
                </Link>
                <header className="max-w-3xl py-12 md:py-16">
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
                        <Film size={14} aria-hidden="true" /> {page.category}
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">{page.title}</h1>
                    <p className="mt-6 text-lg leading-relaxed text-zinc-400 md:text-xl">{page.intro}</p>
                    <div className="mt-8 h-1 w-16 rounded-full bg-gradient-brand" />
                </header>

                <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="min-w-0">
                        {slug === 'cookies' && <AnalyticsPreference />}
                        {page.notice && <p className="mb-6 rounded-card border border-slate-400/20 bg-brand-accent/10 p-5 text-sm leading-7 text-slate-200">{page.notice}</p>}
                        {slug === 'account' ? <AccountPanel /> : (
                            <div className={page.category === 'Legal' || slug === 'faq' ? 'space-y-4' : 'grid gap-5 sm:grid-cols-2'}>
                                {page.sections.map((section, index) => slug === 'faq' ? (
                                    <details key={section.title} className="group rounded-card glass p-6" open={index === 0}>
                                        <summary className="cursor-pointer text-lg font-semibold marker:text-slate-400">{section.title}</summary>
                                        <p className="mt-4 leading-7 text-zinc-400">{section.text}</p>
                                        {section.href && <SectionLink href={section.href} label={section.link!} />}
                                    </details>
                                ) : (
                                    <section key={section.title} className="rounded-card glass p-6 md:p-8">
                                        <span aria-hidden="true" className="mb-5 block text-sm font-semibold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                                        <h2 className="break-words text-xl font-bold">{section.title}</h2>
                                        <p className="mt-4 break-words text-sm leading-7 text-zinc-400">{section.text}</p>
                                        {section.href && <SectionLink href={section.href} label={section.link!} />}
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                    <aside className="rounded-card border border-white/10 bg-white/[0.03] p-6">
                        <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-zinc-500">More in {page.category}</h2>
                        <nav aria-label={`${page.category} pages`} className="space-y-1">
                            {related.map(([key, item]) => <Link key={key} href={`/${key}`} className="flex items-center justify-between gap-3 rounded-button px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">{item.title}<ArrowRight size={14} aria-hidden="true" /></Link>)}
                        </nav>
                        <div className="mt-6 border-t border-white/10 pt-6">
                            <p className="text-lg font-bold text-gradient">Ready for movie night?</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">Find your next favorite.</p>
                            <Link href="/movies" className="mt-5 inline-flex items-center gap-2 rounded-button bg-gradient-brand px-5 py-3 text-sm font-bold transition-shadow hover:shadow-glow">Explore movies <ArrowRight size={16} aria-hidden="true" /></Link>
                        </div>
                    </aside>
                </div>
            </div>
            <Footer />
        </div>
    );
}

function SectionLink({ href, label }: { href: string; label: string }) {
    return <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white">{label}<ArrowRight size={15} aria-hidden="true" /></Link>;
}
