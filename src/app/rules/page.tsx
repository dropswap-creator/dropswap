import Link from 'next/link'
import { ShieldCheck, AlertTriangle, Ban, CheckCircle } from 'lucide-react'

const allowed = [
  'Clothing & accessories',
  'Books, games & media',
  'Toys & children\'s items',
  'Sports & outdoor equipment',
  'Home & garden items',
  'Art, crafts & handmade goods',
  'Musical instruments',
  'Food & non-alcoholic drinks',
  'Collectibles & antiques',
  'Furniture',
  'Tools & DIY equipment',
  'Free giveaway items (small listing fee applies)',
]

const prohibited = [
  'Electronics of any kind (phones, laptops, TVs, etc.) — these may fail after the swap and cause disputes',
  'Weapons, knives, or anything designed to cause harm',
  'Illegal drugs, substances, or paraphernalia',
  'Alcohol or tobacco products',
  'Adult or explicit content of any kind',
  'Counterfeit, fake, or replica goods',
  'Stolen goods',
  'Live animals',
  'Prescription medication',
  'Anything illegal under the laws of your country',
]

const conduct = [
  {
    title: 'Spam & failed swaps',
    desc: 'Repeatedly agreeing to swaps and then not following through will result in a warning. After 3 failed swaps you will be permanently banned from DropSwap.',
  },
  {
    title: 'Honest listings',
    desc: 'You must provide at least 2 clear, accurate photos of your item. Deliberately misrepresenting an item\'s condition will result in account suspension.',
  },
  {
    title: 'Respect',
    desc: 'Harassment, abuse, or threatening behaviour toward other users will result in an immediate ban with no warning.',
  },
  {
    title: 'One account per person',
    desc: 'Creating multiple accounts to evade a ban or manipulate trust scores is prohibited and will result in all accounts being permanently removed.',
  },
  {
    title: 'Disputes',
    desc: 'If a swap goes wrong, use the in-app dispute system first. If unresolved, you can escalate to the DropSwap team who will review and make a final decision.',
  },
]

export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Community Rules</h1>
        <p className="text-gray-500">
          DropSwap works because people are honest. These rules keep it that way.
        </p>
      </div>

      {/* Allowed */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={20} className="text-green-500" />
          <h2 className="font-bold text-gray-900 text-lg">What you can swap</h2>
        </div>
        <ul className="space-y-2">
          {allowed.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Prohibited */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Ban size={20} className="text-red-500" />
          <h2 className="font-bold text-gray-900 text-lg">What is NOT allowed</h2>
        </div>
        <ul className="space-y-2">
          {prohibited.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
              <span className="text-red-500 mt-0.5 shrink-0">✗</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Conduct */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={20} className="text-indigo-500" />
          <h2 className="font-bold text-gray-900 text-lg">Code of conduct</h2>
        </div>
        <div className="space-y-4">
          {conduct.map((item, i) => (
            <div key={i}>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning system */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} className="text-amber-500" />
          <h2 className="font-bold text-gray-900">Strike system</h2>
        </div>
        <div className="space-y-2">
          {[
            { strike: '1st failed swap', action: 'Reminder notice sent to your email' },
            { strike: '2nd failed swap', action: 'Official warning — account flagged' },
            { strike: '3rd failed swap', action: 'Permanent ban — no appeal' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-amber-700 w-40 shrink-0">{s.strike}</span>
              <span className="text-gray-600">{s.action}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-400">
        By using DropSwap you agree to these rules and our{' '}
        <Link href="/terms" className="text-indigo-600 hover:underline">Terms & Conditions</Link>.
        Rules may be updated at any time.
      </p>
    </div>
  )
}
