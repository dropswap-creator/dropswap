import Link from 'next/link'
import { PackageOpen, Search, ArrowLeftRight, CheckCircle, Gift, Shield, Star } from 'lucide-react'

const steps = [
  {
    icon: <PackageOpen size={32} className="text-indigo-600" />,
    title: 'Post your item',
    description: 'List anything you want to swap — clothes, books, furniture, collectibles and more. Add at least 2 clear photos and a honest description.',
  },
  {
    icon: <Search size={32} className="text-indigo-600" />,
    title: 'Browse your country',
    description: 'See items listed by people in your country. A hat for a mug, clothes for clothes — anything goes as long as both people agree.',
  },
  {
    icon: <ArrowLeftRight size={32} className="text-indigo-600" />,
    title: 'Make an offer',
    description: 'See something you like? Offer one of your items in exchange. Chat with the other person to agree on the deal.',
  },
  {
    icon: <CheckCircle size={32} className="text-indigo-600" />,
    title: 'Swap & rate',
    description: 'Both confirm shipping and receipt through DropSwap. Once done, leave each other a rating to build your trust score.',
  },
]

const values = [
  {
    icon: <Gift size={24} className="text-indigo-600" />,
    title: 'No money needed',
    description: 'DropSwap is a true bartering platform — like the good old days before money existed. Trade the value you have for the value you want.',
  },
  {
    icon: <Shield size={24} className="text-indigo-600" />,
    title: 'Built-in protection',
    description: 'Our swap confirmation system means both parties must confirm shipping and receipt before a swap is marked complete.',
  },
  {
    icon: <Star size={24} className="text-indigo-600" />,
    title: 'Trust scores',
    description: 'Every completed swap builds your reputation. See who you can trust before you agree to a deal.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How DropSwap Works</h1>
        <p className="text-lg text-gray-500">
          A true bartering platform — like the good old days before money existed.
          Trade what you have for what you want. Simple.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-16">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-5 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="shrink-0 w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step {i + 1}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
              <p className="text-gray-500 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {values.map((v, i) => (
          <div key={i} className="bg-indigo-50 rounded-2xl p-5">
            <div className="mb-3">{v.icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
            <p className="text-sm text-gray-500">{v.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center bg-indigo-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to start swapping?</h2>
        <p className="text-indigo-200 mb-5">Join thousands of people trading items every day — no money required.</p>
        <Link
          href="/auth/signup"
          className="inline-block bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Create free account
        </Link>
      </div>
    </div>
  )
}
