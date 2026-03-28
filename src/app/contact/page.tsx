'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Send, AlertTriangle } from 'lucide-react'

const REPORT_TYPES = [
  'Scam or fraud',
  'Item not sent',
  'Item misrepresented',
  'Harassment or abuse',
  'Prohibited item listed',
  'Fake account',
  'Dispute escalation',
  'Other',
]

export default function ContactPage() {
  const [type, setType] = useState('')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)

    // Store report in database
    await supabase.from('reports').insert({
      type,
      details,
      contact_email: email,
    }).select()

    setSending(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report received</h2>
        <p className="text-gray-500">
          Thank you. The DropSwap team will review your report within 48 hours.
          {email && " We'll be in touch at the email you provided."}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-2xl mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
        <p className="text-gray-500">
          Something not right? Let us know and we'll look into it within 48 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type of issue</label>
          <select
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            <option value="">Select...</option>
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
          <textarea
            required
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            placeholder="Please describe the issue in as much detail as possible. Include usernames, item names, or swap IDs if relevant..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your email <span className="text-gray-400 font-normal">(optional — if you want a response)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
          {sending ? 'Sending...' : 'Submit report'}
        </button>
      </form>
    </div>
  )
}
