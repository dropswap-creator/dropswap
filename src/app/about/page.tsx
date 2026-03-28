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
          "Trade like the old days. Keep it local. Keep the community alive."
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 leading-relaxed">
        <p>
          Rent is up. Food is up. Energy bills are up. Wages? Not so much. The cost of living has hit everyone hard — and the system that's supposed to help isn't working for ordinary people.
        </p>
        <p>
          DropSwap is our answer to that.
        </p>
        <p>
          Long before banks, before currencies, before governments taxing every transaction — people just traded. A farmer gave grain to a blacksmith in exchange for tools. A neighbour swapped home-grown vegetables for a hand-sewn coat. Communities thrived because they looked after each other, not because a corporation or a government told them to.
        </p>
        <p>
          That's the world DropSwap is trying to bring back.
        </p>
        <p>
          We believe value is what two people agree it is — not what a price tag says. A hat might be worth a mug to one person and a jacket to another. No middlemen. No platform taking 15%. No algorithms. No government getting a cut of your trade. Just two people, two items, and a handshake.
        </p>
        <p>
          DropSwap is free to use, built on trust, and designed for real communities. Whether you're in a city, a town, or a village — there's someone near you who has what you need, and needs what you have.
        </p>
        <p className="font-medium text-gray-800">
          Stop shopping. Start swapping. Keep it local.
        </p>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="font-bold text-gray-900 text-lg mb-3">Our principles</h2>
          <ul className="space-y-2">
            {[
              'The cost of living is a problem — swapping is part of the solution',
              'No money changes hands — this is pure barter, nothing else',
              'Keep it local — build real connections in your community',
              'Any item can be swapped for any other item — as long as both people agree',
              'Honesty is everything — describe and photograph your items accurately',
              'Respect the community — treat others as you would want to be treated',
              'Trust is earned — every completed swap builds your reputation',
            ].map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">→</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-indigo-50 rounded-xl p-5">
          <p className="text-indigo-800 font-medium text-sm">
            "Where communities look after each other, and waste becomes a thing of the past. One swap at a time."
          </p>
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
