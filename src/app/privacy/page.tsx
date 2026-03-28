export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: March 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 text-sm leading-relaxed">
        {[
          {
            title: '1. Who We Are',
            body: 'DropSwap is a peer-to-peer bartering platform. References to "we", "us", or "DropSwap" refer to the DropSwap platform and its operator. We are committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.',
          },
          {
            title: '2. What Data We Collect',
            body: 'We collect: your email address (required for account creation), your country of residence (required for matching you with local swappers), any profile information you voluntarily provide (username, bio, profile photo), item listings you post including photos and descriptions, messages sent through the platform between swap participants, swap history and ratings, and reports you submit.',
          },
          {
            title: '3. What We Do NOT Collect',
            body: 'We do not collect your home address — this is only exchanged privately between users in messages when both parties agree. We do not collect payment card details — these are handled entirely by Stripe and never touch our servers. We do not collect government ID or identity documents.',
          },
          {
            title: '4. How We Use Your Data',
            body: 'We use your data to: operate and improve the DropSwap platform, match you with users in your country, enable swap transactions between users, detect and prevent fraud, spam, and abuse, respond to reports and resolve disputes, and send you important platform notifications.',
          },
          {
            title: '5. Address & Location Sharing',
            body: 'Your full home address is never stored by DropSwap. If you choose to arrange in-person collection or home collection for a giveaway item, your address is shared only with the specific confirmed swap or giveaway participant, and only through our private messaging system. You are never required to share your home address.',
          },
          {
            title: '6. Data Sharing',
            body: 'We do not sell your personal data. We share data only with: Supabase (our database and authentication provider), Stripe (payment processing for giveaway listing fees and swap bonds — they have their own privacy policy), and law enforcement or regulators where required by law.',
          },
          {
            title: '7. Data Retention',
            body: 'We retain your data for as long as your account is active. If you request account deletion, we will remove your personal data within 7 days. Some data may be retained longer where required by law (e.g. financial transaction records).',
          },
          {
            title: '8. Your Rights (UK GDPR)',
            body: 'You have the right to: access the personal data we hold about you, correct inaccurate data, request deletion of your data ("right to be forgotten"), object to processing of your data, and data portability. To exercise any of these rights, contact us via the Report/Contact page.',
          },
          {
            title: '9. Cookies',
            body: 'DropSwap uses only essential cookies required for authentication and session management. We do not use advertising or tracking cookies.',
          },
          {
            title: '10. Children',
            body: 'DropSwap is strictly for users aged 18 and over. We do not knowingly collect data from anyone under 18. If you believe a minor has registered, please report it immediately via our Contact page.',
          },
          {
            title: '11. Changes',
            body: 'We may update this policy from time to time. We will notify registered users of material changes via email.',
          },
          {
            title: '12. Contact',
            body: 'For any privacy-related queries or to exercise your rights, please use the Contact/Report page on DropSwap.',
          },
        ].map((section, i) => (
          <div key={i}>
            <h2 className="font-bold text-gray-900 mb-2">{section.title}</h2>
            <p>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
