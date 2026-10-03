import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageSquare,
  XCircle
} from 'lucide-react';
import API from '../services/api';

const STATUS_META = {
  PENDING: {
    label: 'Awaiting seller response',
    className: 'border-amber-500/20 bg-amber-500/5 text-amber-300'
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
  },
  DECLINED: {
    label: 'Declined',
    className: 'border-red-500/20 bg-red-500/5 text-red-300'
  }
};

export default function GigCustomOffersPage({ currentUser }) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSeller = currentUser?.role === 'STUDENT_FREELANCER';
  const isBuyer = currentUser?.role === 'CLIENT';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    API.get('/gig-custom-offers')
      .then((response) => setOffers(response.data || []))
      .catch((err) => {
        setError(err?.response?.data?.error || 'Unable to load custom offers.');
      })
      .finally(() => setLoading(false));
  }, [currentUser, navigate]);

  const visibleOffers = useMemo(() => (
    offers.filter((offer) =>
      isSeller
        ? offer.sellerId === currentUser?.id
        : offer.buyerId === currentUser?.id
    )
  ), [offers, isSeller, currentUser?.id]);

  const loadRazorpay = () => new Promise((resolve) => {
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

  const respond = async (offer, action) => {
    setBusyId(offer.id);
    setError('');
    setSuccess('');

    try {
      const response = await API.post(`/gig-custom-offers/${offer.id}/respond`, { action });
      const updated = response.data?.offer;
      if (updated) {
        setOffers((previous) =>
          previous.map((item) => item.id === updated.id ? updated : item)
        );
      }
      setSuccess(action === 'ACCEPT'
        ? 'Custom offer accepted.'
        : 'Custom offer declined.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update this custom offer.');
    } finally {
      setBusyId('');
    }
  };

  const acceptForPayment = async (offer) => {
    setBusyId(offer.id);
    setError('');
    setSuccess('');

    try {
      const response = await API.post(`/gig-custom-offers/${offer.id}/accept`);
      const order = response.data?.order;

      if (!order?.id) {
        throw new Error('The payment order could not be created.');
      }

      setOffers((previous) =>
        previous.map((item) =>
          item.id === offer.id
            ? { ...item, orderId: order.id, order }
            : item
        )
      );

      if (!response.data?.checkoutRequired || !order.razorpayOrderId) {
        navigate(`/orders/${order.id}`);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Payment gateway could not be loaded. Please try again.');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key',
        amount: Math.round(Number(order.totalAmount || 0) * 100),
        currency: 'INR',
        name: 'SkillLaunch Escrow',
        description: `${offer.gig?.title || 'Custom gig offer'} — Custom Offer`,
        order_id: order.razorpayOrderId,
        handler: async (paymentResponse) => {
          try {
            await API.post(`/orders/${order.id}/verify-payment`, {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });
            navigate(`/orders/${order.id}`);
          } catch (verifyErr) {
            setError(
              verifyErr?.response?.data?.error ||
              'Payment was received, but verification could not be completed.'
            );
            setBusyId('');
          }
        },
        modal: {
          ondismiss: () => setBusyId('')
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
      rzp.on('payment.failed', (paymentError) => {
        setError(
          paymentError?.error?.description ||
          'The payment was not completed.'
        );
        setBusyId('');
      });
      rzp.open();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err.message ||
        'Unable to continue to payment.'
      );
      setBusyId('');
    }
  };

  if (!currentUser || (!isBuyer && !isSeller)) {
    return (
      <section className="glass-panel rounded-3xl border border-slate-800 p-8">
        <p className="text-sm text-slate-400">
          Custom offers are available to client and student freelancer accounts.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <section className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10">
          <Link
            to={isSeller ? '/student/gigs' : '/gigs'}
            className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
            Gig marketplace
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Custom Offers
          </h1>
          <p className="text-sm leading-6 text-slate-500 mt-2 max-w-2xl">
            {isSeller
              ? 'Review requests for work outside your standard gig packages.'
              : 'Track custom work requests and continue to secure payment after a seller accepts.'}
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-bold text-emerald-300">
          {success}
        </div>
      )}

      {loading ? (
        <section className="glass-panel rounded-3xl border border-slate-800 p-10 text-center text-sm text-slate-500">
          Loading custom offers…
        </section>
      ) : visibleOffers.length === 0 ? (
        <section className="glass-panel rounded-3xl border border-slate-800 p-10 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-indigo-400" />
          <h2 className="text-lg font-black text-white mt-4">No custom offers yet</h2>
          <p className="text-sm text-slate-500 mt-2">
            {isSeller
              ? 'Incoming custom requests will appear here.'
              : 'Custom requests you send from gig pages will appear here.'}
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {visibleOffers.map((offer) => {
            const status = STATUS_META[offer.status] || STATUS_META.PENDING;
            const busy = busyId === offer.id;

            return (
              <article
                key={offer.id}
                className="glass-panel rounded-3xl border border-slate-800 p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <Link
                      to={`/gigs/${offer.gigId}`}
                      className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition"
                    >
                      {offer.gig?.title || 'Gig'}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${status.className}`}>
                        {status.label}
                      </span>
                      {offer.orderId && (
                        <span className="px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[10px] font-black text-cyan-300">
                          Payment order created
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                      {offer.requestedWork}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-5 text-xs font-bold text-slate-500">
                      <span>Price · ₹{Number(offer.proposedPrice || 0).toLocaleString('en-IN')}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        {offer.deliveryDays} days
                      </span>
                      <span>
                        {isSeller ? `Buyer · ${offer.buyer?.fullName || 'Client'}` : `Seller · ${offer.seller?.fullName || 'Freelancer'}`}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-wrap gap-2">
                    {isSeller && offer.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => respond(offer, 'ACCEPT')}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-black text-emerald-300 hover:text-white transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => respond(offer, 'DECLINE')}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-black text-red-300 hover:text-white transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </button>
                      </>
                    )}

                    {isBuyer && offer.status === 'ACCEPTED' && !offer.orderId && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => acceptForPayment(offer)}
                        className="inline-flex items-center gap-2 rounded-xl neon-airflow-btn px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
                      >
                        {busy ? 'Opening payment…' : 'Continue to Payment'}
                      </button>
                    )}

                    {offer.orderId && (
                      <Link
                        to={`/orders/${offer.orderId}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-300 hover:text-white transition"
                      >
                        Open Order
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
