import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Star,
  MessageSquarePlus,
  X
} from 'lucide-react';
import API from '../services/api';
import { sanitizeRichTextHtml } from '../utils/richText.js';

const pendingGigViewEvents = new Map();

export default function GigDetailsPage({ currentUser }) {
  const { gigId } = useParams();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [error, setError] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [customOfferOpen, setCustomOfferOpen] = useState(false);
  const [customOfferBusy, setCustomOfferBusy] = useState(false);
  const [customOfferError, setCustomOfferError] = useState('');
  const [customOfferToast, setCustomOfferToast] = useState(null);
  const [customOfferForm, setCustomOfferForm] = useState({
    requestedWork: '',
    proposedPrice: '',
    deliveryDays: ''
  });
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const recordAnalyticsEvent = useCallback((type) => {
    const eventId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return API.post(`/gigs/${gigId}/analytics`, {
      type,
      eventId,
      metadata: { source: 'gig_detail' }
    }).catch((analyticsError) => {
      console.debug('Gig analytics event skipped:', analyticsError);
    });
  }, [gigId]);

  const toggleFavorite = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFavoriteBusy(true);

    try {
      const response = await API.post(`/gigs/${gigId}/favorite`);
      setFavorited(Boolean(response.data?.favorited));
      setFavoriteCount(Number(response.data?.favorites || 0));
    } catch (favoriteError) {
      console.error('Gig favorite update failed:', favoriteError);
    } finally {
      setFavoriteBusy(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const purchaseGig = async () => {
    if (!currentUser || !selectedPackage?.id) return;

    setPurchaseError('');
    void recordAnalyticsEvent('PURCHASE_CLICK');

    try {
      const res = await API.post('/orders/gig-purchase', {
        gigId,
        gigPackageId: selectedPackage.id
      });

      const order = res.data?.order;

      if (res.data?.checkoutRequired && order?.razorpayOrderId) {
        const isLoaded = await loadRazorpay();

        if (!isLoaded) {
          setPurchaseError('Payment gateway could not be loaded. Please try again.');
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key',
          amount: Math.round(Number(order.totalAmount || 0) * 100),
          currency: 'INR',
          name: 'SkillLaunch Escrow',
          description: `${gig.title} — ${selectedPackage.tierName}`,
          order_id: order.razorpayOrderId,
          handler: async (response) => {
            try {
              await API.post(`/orders/${order.id}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              navigate(`/orders/${order.id}`);
            } catch (verifyErr) {
              console.error('Gig payment verification failed:', verifyErr);
              setPurchaseError(
                verifyErr?.response?.data?.error ||
                'Payment was received, but verification could not be completed.'
              );
            }
          },
          modal: {
            ondismiss: () => {
              // The backend keeps the pending order; a later retry can use it.
            }
          },
          prefill: {
            name: currentUser?.fullName || 'Client Account',
            email: currentUser?.email || 'client@skilllaunch.com'
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', (response) => {
          setPurchaseError(
            response?.error?.description ||
            'The payment was not completed.'
          );
        });

        rzp.open();
        return;
      }

      if (order?.id) {
        navigate(`/orders/${order.id}`);
      }
    } catch (err) {
      console.error('Gig purchase initialization failed:', err);
      setPurchaseError(
        err?.response?.data?.error ||
        'Unable to start the purchase. Please try again.'
      );
    }
  };

  const submitCustomOffer = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setCustomOfferError('');

    const requestedWork = String(customOfferForm.requestedWork || '').trim();
    const proposedPrice = Number(customOfferForm.proposedPrice);
    const deliveryDays = Number(customOfferForm.deliveryDays);

    if (!requestedWork) {
      setCustomOfferError('Describe the custom work you need.');
      return;
    }

    if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
      setCustomOfferError('Enter a valid proposed price.');
      return;
    }

    if (!Number.isInteger(deliveryDays) || deliveryDays <= 0) {
      setCustomOfferError('Enter a valid delivery period in whole days.');
      return;
    }

    setCustomOfferBusy(true);

    try {
      await API.post('/gig-custom-offers', {
        gigId,
        requestedWork,
        proposedPrice,
        deliveryDays
      });

      setCustomOfferToast({
        visible: true,
        message: 'Custom offer requested successfully.'
      });

      window.setTimeout(() => {
        setCustomOfferToast((current) =>
          current ? { ...current, visible: false } : current
        );

        window.setTimeout(() => {
          setCustomOfferToast(null);
        }, 700);
      }, 4000);

      setCustomOfferForm({
        requestedWork: '',
        proposedPrice: '',
        deliveryDays: ''
      });
      setCustomOfferOpen(false);
    } catch (err) {
      setCustomOfferError(
        err?.response?.data?.error ||
        'Unable to send your custom offer. Please try again.'
      );
    } finally {
      setCustomOfferBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    API.get(`/gigs/${gigId}`)
      .then((res) => {
        if (cancelled) return;

        const nextGig = res.data;
        setGig(nextGig);
        setFavorited(Boolean(nextGig?.analytics?.favorited));
        setFavoriteCount(Number(nextGig?.analytics?.favorites || 0));

        if (!pendingGigViewEvents.has(gigId)) {
          const viewPromise = recordAnalyticsEvent('VIEW').finally(() => {
            pendingGigViewEvents.delete(gigId);
          });
          pendingGigViewEvents.set(gigId, viewPromise);
        }

        const firstPackage = Array.isArray(nextGig?.packages)
          ? nextGig.packages[0]
          : null;

        setSelectedPackageId(firstPackage?.id || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error || 'Unable to load this gig.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gigId, recordAnalyticsEvent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-indigo-400">
        <div className="text-sm font-black uppercase tracking-widest animate-pulse">
          Loading Gig
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <section className="glass-panel rounded-3xl border border-slate-800 p-8 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-red-300">
          Gig Unavailable
        </p>
        <h1 className="text-2xl font-black text-white mt-2">
          {error || 'This gig could not be found.'}
        </h1>
        <Link
          to="/gigs"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-black text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gigs
        </Link>
      </section>
    );
  }

  const packages = Array.isArray(gig.packages) ? gig.packages : [];
  const selectedPackage =
    packages.find((item) => item.id === selectedPackageId) || packages[0] || null;

  const gigDelivery =
    gig?.draftData?.delivery &&
    typeof gig.draftData.delivery === 'object'
      ? gig.draftData.delivery
      : {};

  const acceptingOrders =
    typeof gigDelivery.acceptingOrders === 'boolean'
      ? gigDelivery.acceptingOrders
      : true;

  const unavailableUntil =
    typeof gigDelivery.unavailableUntil === 'string'
      ? gigDelivery.unavailableUntil.trim()
      : '';

  const unavailableUntilLabel = unavailableUntil
    ? (() => {
        const parsed = new Date(`${unavailableUntil}T00:00:00Z`);
        return Number.isNaN(parsed.getTime())
          ? ''
          : parsed.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC'
            });
      })()
    : '';

  const todayDateString = new Date().toISOString().split('T')[0];
  const effectiveAcceptingOrders =
    acceptingOrders ||
    (unavailableUntil && unavailableUntil <= todayDateString);

  const seller = gig.seller;
  const profile = seller?.profile;
  const reviewCount = seller?.totalReviews || 0;
  const rating = Number(seller?.averageRating || 0);
  const liveDemoUrl = (() => {
    const value = String(gig?.draftData?.media?.liveDemoUrl || '').trim();
    if (!value) return '';

    try {
      const parsed = new URL(value);
      return /^(https?:)$/i.test(parsed.protocol) && parsed.hostname
        ? value
        : '';
    } catch {
      return '';
    }
  })();

  const videoUrl = (() => {
    const value = String(gig?.draftData?.media?.video?.url || '').trim();
    if (!value) return '';

    try {
      const parsed = new URL(value);
      return /^(https?:)$/i.test(parsed.protocol) && parsed.hostname
        ? value
        : '';
    } catch {
      return '';
    }
  })();

  return (
    <>
        {customOfferToast && (
          <div
            className={[
              'fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-md',
              'transition-all duration-700 ease-in-out',
              customOfferToast.visible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]" />
              <p className="text-sm font-bold text-emerald-300">
                {customOfferToast.message}
              </p>
            </div>
          </div>
        )}

    <div className="space-y-6 pb-16">
      <Link
        to="/gigs"
        className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Gigs
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="h-64 sm:h-80 bg-slate-900">
              <img
                src={gig.coverImage}
                alt={gig.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-black text-cyan-300">
                  {gig.category || 'Service'}
                </span>

                {gig.subcategory && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-black text-slate-400">
                    {gig.subcategory}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white mt-4">
                {gig.title}
              </h1>

              {sanitizeRichTextHtml(gig.description || '') ? (
                <div
                  className="mt-5 max-w-none break-words text-base leading-7 text-slate-300 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-black [&_strong]:text-white [&_b]:font-black [&_b]:text-white [&_em]:italic [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:pl-1"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichTextHtml(gig.description || '')
                  }}
                />
              ) : (
                <p className="text-base leading-7 text-slate-500 mt-5">
                  No service description has been added yet.
                </p>
              )}
            </div>
          </div>

          <section className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-xl font-black text-white">
                  Freelancer
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review the creator before selecting a package.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={seller?.fullName || 'Freelancer'}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl font-black text-indigo-300">
                  {(seller?.fullName || 'S').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    {seller?.fullName || 'Freelancer'}
                  </h3>

                  {seller?.verification?.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-400 mt-1">
                  {profile?.tagline || 'Student Freelancer'}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                  <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                    <Star className="w-4 h-4 fill-amber-300" />
                    {reviewCount > 0 ? rating.toFixed(1) : 'New'}
                  </span>

                  <span className="text-slate-500">
                    {reviewCount} review{reviewCount === 1 ? '' : 's'}
                  </span>

                  <span className="text-slate-500">
                    {profile?.college || 'Student Creator'}
                  </span>

                  {String(profile?.responseTimeExpectation || '').trim() && (
                    <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-300">
                      Response: {String(profile.responseTimeExpectation).trim()}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={`/u/${seller?.username || seller?.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-sm font-black text-white"
              >
                View Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {(() => {
            const policyValue = String(gig?.draftData?.usageRightsPolicy || '').trim();

            const policy = {
              'buyer-owns-final-work': {
                label: 'Buyer owns the final delivered work',
                description:
                  'The buyer receives ownership of the final deliverable created specifically for this gig, unless a stated exception applies.'
              },
              'license-commercial-use': {
                label: 'Commercial-use license',
                description:
                  'The buyer receives a license to use the delivered work for commercial purposes; ownership remains with the freelancer unless otherwise agreed in the gig.'
              },
              'license-personal-use': {
                label: 'Personal-use license',
                description:
                  'The buyer may use the delivered work for personal purposes only; commercial redistribution or resale is not included.'
              },
              'portfolio-display-only': {
                label: 'Portfolio / display use only',
                description:
                  'The delivered work is provided for portfolio or display purposes and does not include broader commercial usage rights.'
              }
            }[policyValue];

            return policy ? (
              <section className="glass-panel rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                    Usage & ownership
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    What the buyer receives
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This gig uses the following structured SkillLaunch usage and ownership policy.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">
                        {policy.label}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-400">
                        {policy.description}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null;
          })()}

          {videoUrl ? (
            <section className="glass-panel rounded-3xl border border-slate-800 p-6">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                  Service introduction
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Video
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Watch a short introduction to the service before placing an order.
                </p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <div className="aspect-video w-full bg-slate-900">
                    <video
                      src={videoUrl}
                      controls
                      preload="metadata"
                      className="h-full w-full object-contain"
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {liveDemoUrl ? (
            <section className="glass-panel rounded-3xl border border-cyan-500/20 p-6">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                  Interactive demo
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Live demo
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Explore a live example of the service before placing an order.
                </p>

                <a
                  href={liveDemoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-400 transition"
                >
                  Open live demo
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="glass-panel rounded-3xl border border-slate-800 p-6 sticky top-6">
            {!effectiveAcceptingOrders && (
              <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
                  Currently unavailable
                </p>
                <p className="mt-2 text-sm font-black text-white">
                  This freelancer is not accepting new orders right now.
                </p>
                {unavailableUntilLabel ? (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Expected to accept orders again from {unavailableUntilLabel}.
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    No return date has been provided.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                  Choose Package
                </p>
                <h2 className="text-xl font-black text-white mt-1">
                  Service Options
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={favoriteBusy}
                  aria-pressed={favorited}
                  aria-label={favorited ? 'Remove gig from favorites' : 'Add gig to favorites'}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-black text-slate-300 hover:border-indigo-500/40 hover:text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current text-indigo-400' : ''}`} />
                  <span>{favoriteCount}</span>
                </button>

                <span className="text-xs font-black text-slate-500">
                  {packages.length} option{packages.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {packages.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">
                No packages are currently available for this gig.
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map((item) => {
                  const selected = item.id === selectedPackage?.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPackageId(item.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        selected
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-white">
                            {item.tierName}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {item.description || 'Standard service package'}
                          </p>
                        </div>

                        <p className="text-xl font-black text-emerald-300 shrink-0">
                          ₹{Number(item.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4 text-sm">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Clock3 className="w-4 h-4" />
                          {item.deliveryDays} days
                        </span>

                        <span className="text-slate-400">
                          {item.revisions} revision{item.revisions === 1 ? '' : 's'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPackage && (
              <>
                <div className="mt-5 border-t border-slate-800 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-400">
                    {selectedPackage.tierName} package details
                  </p>

                  {selectedPackage.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {selectedPackage.description}
                    </p>
                  ) : null}

                  {Array.isArray(selectedPackage.features) &&
                  selectedPackage.features.filter((item) => String(item || '').trim()).length > 0 ? (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Features
                      </p>
                      <ul className="mt-3 space-y-2">
                        {selectedPackage.features
                          .filter((item) => String(item || '').trim())
                          .map((item, index) => (
                            <li
                              key={`selected-feature-${index}`}
                              className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                            >
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                              <span>{item}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedPackage.scope &&
                  Array.isArray(selectedPackage.scope.includedItems) &&
                  selectedPackage.scope.includedItems.filter((item) => String(item || '').trim()).length > 0 ? (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Included
                      </p>
                      <ul className="mt-3 space-y-2">
                        {selectedPackage.scope.includedItems
                          .filter((item) => String(item || '').trim())
                          .map((item, index) => (
                            <li
                              key={`selected-included-${index}`}
                              className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                            >
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                              <span>{item}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedPackage.scope &&
                  Array.isArray(selectedPackage.scope.excludedItems) &&
                  selectedPackage.scope.excludedItems.filter((item) => String(item || '').trim()).length > 0 ? (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Not included
                      </p>
                      <ul className="mt-3 space-y-2">
                        {selectedPackage.scope.excludedItems
                          .filter((item) => String(item || '').trim())
                          .map((item, index) => (
                            <li
                              key={`selected-excluded-${index}`}
                              className="text-sm leading-6 text-slate-400"
                            >
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedPackage.scope &&
                  Array.isArray(selectedPackage.scope.deliverables) &&
                  selectedPackage.scope.deliverables.filter((item) => String(item || '').trim()).length > 0 ? (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Deliverables
                      </p>
                      <ul className="mt-3 space-y-2">
                        {selectedPackage.scope.deliverables
                          .filter((item) => String(item || '').trim())
                          .map((item, index) => (
                            <li
                              key={`selected-deliverable-${index}`}
                              className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm leading-6 text-slate-300"
                            >
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {Array.isArray(gig.extras) && gig.extras.length > 0 ? (
                  <div className="mt-5 border-t border-slate-800 pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-400">
                          Optional extras
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Add-ons available for an additional charge.
                        </p>
                      </div>
                      <span className="text-xs font-black text-slate-500">
                        {gig.extras.length} add-on{gig.extras.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {gig.extras.map((extra, index) => {
                        const extraPrice = Number(extra?.price);
                        const extraTitle = String(extra?.title || '').trim();
                        const extraScope =
                          extra?.scope && typeof extra.scope === 'object'
                            ? String(extra.scope.description || '').trim()
                            : '';

                        return (
                          <article
                            key={extra?.id || `extra-${index}`}
                            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-white">
                                  {extraTitle || 'Optional extra'}
                                </p>
                                {extraScope ? (
                                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                                    {extraScope}
                                  </p>
                                ) : null}
                              </div>

                              <p className="shrink-0 text-base font-black text-amber-300">
                                {Number.isFinite(extraPrice) && extraPrice > 0
                                  ? `+₹${extraPrice.toLocaleString('en-IN')}`
                                  : 'Price not set'}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Selected</span>
                  <span className="text-sm font-black text-white">
                    {selectedPackage.tierName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 mt-2">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-2xl font-black text-emerald-300">
                    ₹{Number(selectedPackage.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {purchaseError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm font-bold text-red-300">
                    {purchaseError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!currentUser || !selectedPackage || !effectiveAcceptingOrders}
                  onClick={purchaseGig}
                  className="w-full mt-5 px-4 py-3 neon-airflow-btn text-white rounded-xl text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!effectiveAcceptingOrders
                    ? 'Currently Unavailable'
                    : currentUser
                      ? 'Continue to Purchase'
                      : 'Sign in to Purchase'}
                </button>

                <button
                  type="button"
                  disabled={!currentUser || !effectiveAcceptingOrders || customOfferBusy}
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/login');
                      return;
                    }
                    setCustomOfferError('');
                    setCustomOfferOpen(true);
                  }}
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-black hover:border-indigo-400/50 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    Request Custom Offer
                  </span>
                </button>

                {!currentUser && (
                  <Link
                    to="/login"
                    className="block text-center text-xs font-black text-indigo-400 hover:text-indigo-300 mt-3"
                  >
                    Sign in to continue
                  </Link>
                )}
                </div>
              </>
            )}

            {customOfferOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
                  <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                        Custom work
                      </p>
                      <h3 className="text-xl font-black text-white mt-1">
                        Request a custom offer
                      </h3>
                      <p className="text-sm leading-6 text-slate-500 mt-2">
                        Tell the seller what falls outside the standard packages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomOfferOpen(false)}
                      className="rounded-xl border border-slate-800 p-2 text-slate-500 hover:text-white transition"
                      aria-label="Close custom offer form"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={submitCustomOffer} className="p-6 space-y-4">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        What do you need?
                      </span>
                      <textarea
                        value={customOfferForm.requestedWork}
                        onChange={(event) =>
                          setCustomOfferForm((previous) => ({
                            ...previous,
                            requestedWork: event.target.value
                          }))
                        }
                        rows={6}
                        maxLength={5000}
                        placeholder="Describe the custom scope, deliverables, or changes you need."
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Proposed price (INR)
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={customOfferForm.proposedPrice}
                          onChange={(event) =>
                            setCustomOfferForm((previous) => ({
                              ...previous,
                              proposedPrice: event.target.value
                            }))
                          }
                          placeholder="1250"
                          className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Delivery (days)
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={customOfferForm.deliveryDays}
                          onChange={(event) =>
                            setCustomOfferForm((previous) => ({
                              ...previous,
                              deliveryDays: event.target.value
                            }))
                          }
                          placeholder="5"
                          className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
                        />
                      </label>
                    </div>

                    {customOfferError && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm font-bold text-red-300">
                        {customOfferError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={customOfferBusy}
                      className="w-full rounded-xl neon-airflow-btn px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {customOfferBusy ? 'Sending…' : 'Send Custom Offer'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
    </>
  );
}
