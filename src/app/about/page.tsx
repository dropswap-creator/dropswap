import Link from 'next/link'
import { ArrowLeftRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-2xl mb-4">
          <ArrowLeftRight size={28} />
          DropSwap
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
        <p className="text-xl text-gray-500 italic">
          "A true bartering platform — like the good old days before money existed."
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 leading-relaxed">
        <p>
          Long before currencies, banks, and credit cards — people traded. A farmer gave grain to a blacksmith in exchange for tools. A tailor swapped clothes for food. Communities thrived on the simple principle that what you have might be exactly what someone else needs, and vice versa.
        </p>
        <p>
          DropSwap was built to bring that back.
        </p>
        <p>
          We believe that value is in the eye of the beholder. A hat might be worth a mug to one person and a jacket to another. As long as both people agree — the swap is fair. No price tags. No money changing hands. Just two people finding value in what the other has to offer.
        </p>
        <p>
          DropSwap is a platform for people within the same country to swap items they no longer need for items they actually want. It's free to use, built on trust, and designed to be as simple as possible.
        </p>
        <p>
          Whether you're clearing out your wardrobe, finding a new home for a childhood toy, or hunting for something unique — DropSwap is your marketplace. Without the market.
        </p>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="font-bold text-gray-900 text-lg mb-3">Our principles</h2>
          <ul className="space-y-2">
            {[
              'Any item can be swapped for any other item — as long as both parties agree',
              'Honesty is everything — describe and photograph your items accurately',
              'Respect the community — treat others as you would want to be treated',
              'No money changes hands — this is pure barter, nothing else',
              'Trust is earned — every completed swap builds your reputation',
            ].map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">→</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/auth/signup"
          className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Join DropSwap — it's free
        </Link>
      </div>
    </div>
  )
}
