export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms & Conditions</h1>
        <p className="text-gray-400 text-sm">Last updated: March 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 text-sm leading-relaxed">
        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By creating an account or using DropSwap, you agree to be bound by these Terms & Conditions. If you do not agree, you must not use DropSwap.',
          },
          {
            title: '2. Who Can Use DropSwap',
            body: 'DropSwap is open to anyone aged 18 or over. By signing up you confirm you are 18 or older. You must provide a valid email address and verify it before using the platform.',
          },
          {
            title: '3. What DropSwap Is',
            body: 'DropSwap is a peer-to-peer bartering platform that connects people within the same country who wish to exchange physical items. DropSwap does not buy, sell, or take ownership of any items. We are a platform only.',
          },
          {
            title: '4. Your Listings',
            body: 'You are solely responsible for the items you list. All listings must include at least 2 accurate photographs. You must not misrepresent the condition, nature, or value of any item. DropSwap reserves the right to remove any listing at any time.',
          },
          {
            title: '5. Prohibited Items',
            body: 'You must not list electronics, weapons, drugs, alcohol, tobacco, counterfeit goods, stolen goods, live animals, prescription medication, or any item that is illegal in your country. A full list is available on our Rules page.',
          },
          {
            title: '6. Swaps & Disputes',
            body: 'DropSwap provides a confirmation system to track the progress of swaps. We are not responsible for items lost in transit, damaged goods, or failed swaps. Disputes should be raised through the platform. DropSwap\'s decision on escalated disputes is final.',
          },
          {
            title: '7. Strike System & Bans',
            body: 'Users who repeatedly agree to swaps and fail to follow through will receive warnings. After 3 failed swaps, your account will be permanently banned. Banned users must not create new accounts.',
          },
          {
            title: '8. Giveaway Listings',
            body: 'Listing an item in the Giveaway section requires a £0.99 fee. This fee is non-refundable once paid. Giveaway listings are subject to the same rules as standard swap listings.',
          },
          {
            title: '9. Trust Scores & Ratings',
            body: 'Ratings are left by users after completed swaps. DropSwap does not edit or remove ratings except in cases of clear abuse. You agree not to manipulate ratings through fake accounts or coercion.',
          },
          {
            title: '10. Privacy',
            body: 'We collect and store your email address and any profile information you choose to provide. We do not sell your data to third parties. Your data is stored securely via Supabase infrastructure.',
          },
          {
            title: '11. Liability',
            body: 'DropSwap is provided "as is". We make no guarantees about the availability, accuracy, or reliability of the platform. We are not liable for any loss, damage, or dispute arising from the use of DropSwap.',
          },
          {
            title: '12. Changes to Terms',
            body: 'We may update these terms at any time. Continued use of DropSwap after changes are posted constitutes acceptance of the new terms.',
          },
          {
            title: '13. Governing Law',
            body: 'These terms are governed by the laws of England and Wales.',
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
