import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold mb-3">
              <Image src="/logo-icon.png" alt="DropSwap" width={24} height={24} className="object-contain" />
              DropSwap
            </div>
            <p className="text-xs text-gray-400 leading-relaxed italic">
              Back to Barter. Swap More. Spend Less. Forward Together.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { label: 'Browse items', href: '/' },
                { label: 'Post an item', href: '/items/new' },
                { label: 'Giveaways', href: '/giveaways' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3">Learn</h4>
            <ul className="space-y-2">
              {[
                { label: 'How it works', href: '/how-it-works' },
                { label: 'About DropSwap', href: '/about' },
                { label: 'FAQ', href: '/faq' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: 'Rules', href: '/rules' },
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Report an issue', href: '/contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} DropSwap. All rights reserved. Governed by the laws of England & Wales.
          </p>
        </div>
      </div>
    </footer>
  )
}
