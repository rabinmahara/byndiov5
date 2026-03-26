import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ThumbsUp, ShieldCheck } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified_purchase: boolean;
  helpful_count?: number;
}

// ─── Product Image Gallery Component ───────────────────────────
function ProductImageGallery({ icon, name, images }: { icon: string; name: string; images?: string[] }) {
  const [activeImg, setActiveImg] = useState(0);
  const isUrl = icon?.startsWith('http');

  if (!isUrl) {
    return (
      <div className="h-72 flex items-center justify-center bg-gray-50 text-[100px]">
        {icon || '📦'}
      </div>
    );
  }

  const rawImgs: string[] = Array.isArray(images) && images.length > 0
    ? images
    : [icon];
  const imgs = rawImgs.length >= 3 ? rawImgs : [...rawImgs, ...Array(3 - rawImgs.length).fill(rawImgs[0])];

  return (
    <div>
      <div
        className="h-80 bg-gray-50 relative overflow-hidden cursor-zoom-in group"
        onClick={() => window.open(imgs[activeImg], '_blank')}
      >
        <img
          src={imgs[activeImg]}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Click to zoom
        </div>
      </div>
      <div className="flex gap-2 p-3 border-t border-gray-100 overflow-x-auto">
        {imgs.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(i)}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
              activeImg === i ? 'border-[#0D47A1]' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const products = useAppStore(state => state.products);
  const product = products.find(p => p.id.toString() === id);
  const { addToCart, toggleWishlist, wishlist, user, addRecentlyViewed, generateAffiliateLink } = useAppStore();
  usePageTitle(product ? `${product.name} — ₹${product.price.toLocaleString('en-IN')}` : 'Product');
  
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [qaList, setQaList] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [myAffiliateCode, setMyAffiliateCode] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{ ok: boolean; msg: string; days?: string } | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const similarProducts = product ? products.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 5) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
    setQty(1);
    setMyAffiliateCode(null);
    fetchReviews();
    fetchQA();
    if (id) addRecentlyViewed(id);
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    setIsLoadingReviews(true);
    try {
      const { data, error } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
      if (!error && data) setReviews(data);
    } catch { /* ignored */ } finally { setIsLoadingReviews(false); }
  };

  const fetchQA = async () => {
    if (!id) return;
    try {
      const { data } = await supabase.from('product_qa').select('*').eq('product_id', id).eq('is_approved', true);
      if (data) setQaList(data);
    } catch (e) { /* ignored */ }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestion.trim()) return;
    try {
      await supabase.from('product_qa').insert({ product_id: id, user_id: user.id, question: newQuestion.trim() });
      setNewQuestion('');
      fetchQA();
    } catch (e) { /* ignored */ }
  };

  const handleGetAffiliateLink = async () => {
    if (!user || !product) return;
    const code = await generateAffiliateLink(product.id.toString());
    if (code) {
      setMyAffiliateCode(code);
      navigator.clipboard.writeText(`${window.location.origin}/products?ref=${code}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setReviewMessage('Please login to submit a review.'); return; }
    if (!newReview.comment.trim()) { setReviewMessage('Please write a comment.'); return; }
    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: id,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'User',
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        verified_purchase: true
      });
      if (error) throw error;
      setReviewMessage('✅ Review submitted!');
      fetchReviews();
      setShowReviewForm(false);
    } catch {
      setReviewMessage('❌ Error submitting review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const checkDelivery = async () => {
    if (!/^\d{6}$/.test(pincode)) { setPincodeResult({ ok: false, msg: 'Enter 6-digit pin' }); return; }
    setCheckingPin(true);
    setTimeout(() => {
      setPincodeResult({ ok: true, msg: '✅ Delivery Available', days: '3-5 days' });
      setCheckingPin(false);
    }, 800);
  };

  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <ProductImageGallery icon={product.icon} name={product.name} images={product.images} />
        
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-[#0D47A1]">₹{product.price.toLocaleString()}</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">In Stock</span>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => addToCart(product, qty)}
              className="flex-1 bg-[#0D47A1] text-white py-3 rounded-lg font-bold hover:bg-[#1565C0] transition-colors"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => toggleWishlist(product.id.toString())}
              className={`p-3 rounded-lg border ${wishlist.includes(product.id.toString()) ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400'}`}
            >
              ❤
            </button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Check Delivery</h3>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Enter Pincode" value={pincode} onChange={e => setPincode(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button onClick={checkDelivery} disabled={checkingPin} className="bg-gray-800 text-white px-4 py-2 rounded">
                {checkingPin ? '...' : 'Check'}
              </button>
            </div>
            {pincodeResult && <p className="mt-2 text-sm">{pincodeResult.msg} {pincodeResult.days}</p>}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {similarProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
