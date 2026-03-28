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
          "Back to Barter. Swap More. Spend Less. Forward Together."
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 leading-relaxed">

        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-3">Who We Are</h2>
          <p>
            DropSwap is a UK-based community platform built by ordinary people who got tired of watching everything get more expensive. We're not a bank, not a marketplace, not a corporation. We're just people who believe there's a smarter way to live — and it's been around for thousands of years.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-3">Why We Built This</h2>
          <p>
            Rent is up. Food is up. Energy is up. Wages aren't keeping pace and the pressure on everyday households is real. Most people already have exactly what someone else needs sitting in their home — a jacket that no longer fits, a book already read, a tool gathering dust in the garage.
          </p>
          <p className="mt-4">
            Money isn't the only form of value. Your stuff has value. Your skills have value. Your time has value. DropSwap lets you use what you already have to get what you actually need — without spending a penny.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-3">Trade Like the Old Days</h2>
          <p>
            Long before banks and price tags, communities traded. A farmer gave grain to a blacksmith for tools. A neighbour swapped vegetables for a coat. No middlemen, no fees, no government taking a cut — just two people making a fair deal.
          </p>
          <p className="mt-4">
            That's what DropSwap brings back. Value is what two people agree it is — not what a label says. You set the terms. You make the trade. You keep everything.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-3">Use Your Resources</h2>
          <p>
            Most of us are sitting on more than we think. Before you buy something new, ask yourself — could I swap for it? Before you throw something away, ask — could someone else use this? DropSwap connects you with people nearby who have what you want and want what you have. No money needs to change hands. Ever.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="font-bold text-gray-900 text-lg mb-3">Our Principles</h2>
          <ul className="space-y-2">
            {[
              'Everything has value — not just money',
              'Use what you already have before spending a penny',
              'Keep it local — build real connections in your area',
              'No middlemen, no platform fees, no percentage taken',
              'Trust is everything — honesty and photos are non-negotiable',
              'The community looks after each other — treat people as you want to be treated',
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
            "The cost of living crisis is a spending problem — and swapping is the answer. Stop buying what you can barter for. Stop wasting what someone else needs. Forward together."
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
