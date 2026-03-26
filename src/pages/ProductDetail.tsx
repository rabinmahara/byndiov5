import { useState, useEffect, useMemo } from 'react';
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

export default function ProductDetail() {
  const { id } = useParams();

  const {
    products,
    addToCart,
    toggleWishlist,
    wishlist,
    user,
    addRecentlyViewed,
    generateAffiliateLink,
    recentlyViewed,
  } = useAppStore();

  const product = useMemo(
    () => products.find(p => p.id.toString() === id),
    [products, id]
  );

  usePageTitle(
    product ? `${product.name} — ₹${product.price.toLocaleString('en-IN')}` : 'Product'
  );

  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [qaList, setQaList] = useState<any[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [myAffiliateCode, setMyAffiliateCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 5);
  }, [products, product]);

  const recentProducts = useMemo(() => {
    return recentlyViewed
      .filter(rid => String(rid) !== String(product?.id))
      .map(rid => products.find(p => String(p.id) === String(rid)))
      .filter(Boolean)
      .slice(0, 4) as typeof products;
  }, [recentlyViewed, products, product]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) addRecentlyViewed(id);
    fetchReviews();
    fetchQA();
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    setIsLoadingReviews(true);
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
    } catch {}
    setIsLoadingReviews(false);
  };

  const fetchQA = async () => {
    if (!id) return;
    try {
      const { data } = await supabase
        .from('product_qa')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      if (data) setQaList(data);
    } catch {}
  };

  const handleAdd = () => {
    if (!product) return;
    addToCart(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleGetAffiliateLink = async () => {
    if (!user || !product) return;
    const code = await generateAffiliateLink(product.id.toString());
    if (!code) return;

    setMyAffiliateCode(code);
    const url = `${window.location.origin}/products?ref=${code}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!product) {
    return <div className="p-6 text-center">Product not found</div>;
  }

  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-4">

      {/* PRODUCT */}
      <div className="bg-white p-5 rounded-xl mb-6">
        <h1 className="text-xl font-bold mb-2">{product.name}</h1>
        <p className="text-lg font-black mb-2">₹{product.price.toLocaleString('en-IN')}</p>

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className={`px-4 py-2 text-white rounded ${addedToCart ? 'bg-green-600' : 'bg-blue-600'}`}
          >
            {addedToCart ? '✓ Added' : 'Add to Cart'}
          </button>

          <button
            onClick={() => toggleWishlist(product.id)}
            className="border px-4 py-2 rounded"
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      {/* SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {similarProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* RECENTLY VIEWED */}
      {recentProducts.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentProducts.map(p => (
              <Link key={p.id} to={`/product/${p.id}`}>
                <div className="border p-2 rounded bg-white">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="font-bold text-blue-600">₹{p.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <section className="bg-white p-5 rounded-xl mb-6">
        <h2 className="font-bold mb-3">Reviews ({reviews.length})</h2>

        {isLoadingReviews ? (
          <p>Loading...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet</p>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="mb-3 border-b pb-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{r.user_name}</span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm">{r.comment}</p>
            </div>
          ))
        )}
      </section>

      {/* Q&A */}
      <section className="bg-white p-5 rounded-xl mb-6">
        <h2 className="font-bold mb-3">Questions & Answers ({qaList.length})</h2>

        {qaList.length === 0 ? (
          <p>No questions yet</p>
        ) : (
          qaList.map(item => (
            <div key={item.id} className="mb-4">

              <div className="flex gap-2">
                <span className="font-bold text-blue-600">Q:</span>
                <span>{item.question}</span>
              </div>

              {item.answer && (
                <div className="flex gap-2 ml-4 text-green-700">
                  <span className="font-bold">A:</span>
                  <span>{item.answer}</span>
                </div>
              )}

            </div>
          ))
        )}
      </section>

      {/* AFFILIATE */}
      {user && (
        <section className="bg-purple-100 p-4 rounded-xl">
          <h3 className="font-bold mb-2">Affiliate</h3>
          <button
            onClick={handleGetAffiliateLink}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            {copiedLink ? 'Copied!' : 'Get Link'}
          </button>

          {myAffiliateCode && (
            <p className="text-xs mt-2">
              {window.location.origin}/products?ref={myAffiliateCode}
            </p>
          )}
        </section>
      )}

    </div>
  );
}
