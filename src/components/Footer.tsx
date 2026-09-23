import Link from 'next/link';

const footerLinks = {
    company: [{ name: 'About Us', href: '/about' }, { name: 'Careers', href: '/careers' }, { name: 'Press', href: '/press' }, { name: 'Blog', href: '/blog' }],
    support: [{ name: 'Help Center', href: '/help' }, { name: 'Contact Us', href: '/contact' }, { name: 'FAQ', href: '/faq' }, { name: 'Account', href: '/account' }],
    legal: [{ name: 'Privacy Policy', href: '/privacy' }, { name: 'Terms of Service', href: '/terms' }, { name: 'Cookie Policy', href: '/cookies' }, { name: 'Licenses', href: '/licenses' }],
    resources: [{ name: 'API', href: '/api' }, { name: 'Developers', href: '/developers' }, { name: 'Partners', href: '/partners' }, { name: 'Affiliates', href: '/affiliates' }],
};

export default function Footer() {
    return <footer className="site-footer">
        <div className="footer-top">
            <div className="footer-brand"><Link href="/" className="brand-name">AJStreams<span className="text-zinc-600">.</span></Link><p className="footer-caption">A world of stories.<br />Your front row seat.</p></div>
            {Object.entries(footerLinks).map(([category, links]) => <div key={category}><h3 className="capitalize">{category}</h3><ul>{links.map(link => <li key={link.href}><Link href={link.href}>{link.name}</Link></li>)}</ul></div>)}
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} AJStreams. All rights reserved.</span><span>Made with love by <Link href="https://aj-bay.vercel.app" className="text-zinc-400 hover:text-white">AJ ↗</Link></span></div>
    </footer>;
}
