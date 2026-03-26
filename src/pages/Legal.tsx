import { useParams, Link } from 'react-router-dom';

const content: Record<string, { title: string; body: string }> = {
  privacy: {
    title: '🔒 Privacy Policy',
    body: `Last updated: January 2025

BYNDIO Technologies Pvt Ltd ("BYNDIO", "we", "us") respects your privacy. This policy explains how we collect, use, and protect your information.

**Information We Collect**
We collect information you provide directly, such as when you create an account, place an order, or contact us. This includes name, email, phone number, shipping address, and payment information. We also collect usage data automatically, such as pages visited, search queries, and device information.

**How We Use Your Information**
We use your information to process orders, provide customer support, personalise your experience, send transactional emails, and improve our platform. We do not sell your personal data to third parties.

**Data Storage & Security**
Your data is stored securely on Supabase infrastructure with row-level security. Payments are processed by Razorpay and we never store card details.

**Your Rights**
You may request access to, correction of, or deletion of your personal data at any time by contacting support@byndio.in.

**Contact**
Email: support@byndio.in | Address: Mumbai, Maharashtra, India`,
  },
  terms: {
    title: '📋 Terms of Use',
    body: `Last updated: January 2025

By using BYNDIO you agree to these terms.

**Eligibility**
You must be 18 years or older to create an account and make purchases on BYNDIO.

**Seller Obligations**
Sellers must list only genuine products, honour orders placed through the platform, and comply with all applicable Indian laws including GST registration where required.

**Buyer Obligations**
Buyers agree not to abuse return policies, file fraudulent chargebacks, or engage in any activity that harms sellers or the platform.

**Prohibited Activities**
Fake reviews, self-referral abuse, account farming, and any fraudulent activity will result in immediate account suspension.

**Limitation of Liability**
BYNDIO acts as a marketplace facilitator. We are not liable for product quality disputes beyond our return policy.

**Contact**
Email: legal@byndio.in`,
  },
  refund: {
    title: '↩️ Refund Policy',
    body: `Last updated: January 2025

**Return Window**
Most products can be returned within 7 days of delivery. Electronics and perishables may have shorter windows as specified on the product page.

**Condition**
Items must be unused, in original packaging, and accompanied by the original invoice.

**Refund Timeline**
Refunds are processed within 5–7 business days after we receive the returned item. Amount is credited to your original payment method or BYNDIO wallet.

**Non-Returnable Items**
Perishable goods, personalised/custom items, and digital products are non-returnable unless defective.

**How to Initiate a Return**
Login → My Orders → Select Order → Request Return. Our team will arrange a free pickup.

**Contact**
Email: returns@byndio.in | Helpline: 1800-BYNDIO`,
  },
};

export default function Legal() {
  const { page } = useParams<{ page: string }>();
  const info = content[page || ''];

  if (!info) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-xl font-black mb-2">Page not found</h2>
        <Link to="/" className="text-[#1565C0] underline">Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F5F5F5] min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link to="/" className="text-[#1565C0] hover:underline">Home</Link> ›
          <span>{info.title}</span>
        </div>
        <h1 className="text-2xl font-black text-[#0D47A1] mb-6">{info.title}</h1>
        <div className="prose prose-sm max-w-none">
          {info.body.split('\n\n').map((para, i) => {
            const parts = para.split(/\*\*(.*?)\*\*/);
            return (
              <p key={i} className="text-[14px] text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                {parts.map((part, j) =>
                  j % 2 === 1
                    ? <strong key={j} className="text-gray-900 font-bold">{part}</strong>
                    : part
                )}
              </p>
            );
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4 flex-wrap">
          {page !== 'privacy' && <Link to="/legal/privacy" className="text-[#1565C0] text-sm hover:underline">Privacy Policy</Link>}
          {page !== 'terms' && <Link to="/legal/terms" className="text-[#1565C0] text-sm hover:underline">Terms of Use</Link>}
          {page !== 'refund' && <Link to="/legal/refund" className="text-[#1565C0] text-sm hover:underline">Refund Policy</Link>}
        </div>
      </div>
    </div>
  );
}
