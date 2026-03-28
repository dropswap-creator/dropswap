'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Is DropSwap free to use?',
    a: 'Yes, completely free. There are no fees for listing items, making offers, or completing swaps. The only exception is our Giveaway section — posting a free item costs £0.99 to prevent spam.',
  },
  {
    q: 'Can I swap any item for any other item?',
    a: 'Yes — as long as both people agree, the swap is fair. A hat for a mug, a book for a plant, clothes for kitchenware — it doesn\'t matter. Value is in the eye of the beholder. The only restriction is our prohibited items list (no electronics, weapons, drugs, etc.).',
  },
  {
    q: 'Why are electronics not allowed?',
    a: 'Electronics can malfunction days or weeks after a swap through no fault of either party, which leads to disputes. To keep the community fair and friction-free, we\'ve excluded them for now.',
  },
  {
    q: 'What happens if someone doesn\'t send their item?',
    a: 'Use the "Raise a dispute" button in the swap thread. Try to resolve it with the other person first. If you can\'t, escalate to DropSwap and our team will review the case. Repeated offenders are warned and ultimately banned.',
  },
  {
    q: 'Do I need to verify my email?',
    a: 'Yes. Email verification is required before you can post items or make swap offers. This helps keep the community genuine.',
  },
  {
    q: 'Can I swap with someone in another country?',
    a: 'Not currently. DropSwap is country-based — you can only swap with people in your country. This keeps postage simple and avoids customs complications.',
  },
  {
    q: 'How does the trust score work?',
    a: 'After every completed swap, both parties rate each other out of 5 stars. Your average rating and number of completed swaps are shown on your profile so others know who they\'re dealing with.',
  },
  {
    q: 'What is the Giveaway section?',
    a: 'The Giveaway section lets you list items completely free for someone else to claim. There\'s a small £0.99 listing fee to post a giveaway — this prevents spam and contributes to running the platform.',
  },
  {
    q: 'How do I report a user or listing?',
    a: 'There is a "Report" button on every listing and profile. Reports go directly to the DropSwap team who review them within 48 hours.',
  },
  {
    q: 'Can I have more than one account?',
    a: 'No. One account per person. Creating multiple accounts to evade a ban or manipulate ratings will result in all your accounts being permanently removed.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Contact us via the Report/Contact page and we\'ll remove your account and all associated data within 7 days.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-medium text-gray-900">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-gray-500 text-sm pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">FAQ</h1>
        <p className="text-gray-500">Everything you need to know about DropSwap.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-6">
        {faqs.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  )
}
