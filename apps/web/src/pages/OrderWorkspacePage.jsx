import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, FileText, Send, AlertTriangle, ArrowLeft, Paperclip, X, History, MessageCircle, Clock3, Wallet, ClipboardCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';
import { io as createSocket } from 'socket.io-client';

export default function OrderWorkspacePage({ currentUser }) {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [deliverLink, setDeliverLink] = useState('');
  const [deliverNote, setDeliverNote] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatAttachment, setChatAttachment] = useState(null);
  const [chatUploading, setChatUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'System', text: 'Welcome to Order Workspace. Realtime AI chat filter active.' }
  ]);
  const [chatWarning, setChatWarning] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatPanelRef = useRef(null);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [reviewForm, setReviewForm] = useState({
    overallRating: 5,
    communicationRating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const isClient = currentUser?.id === order?.clientId;
  const isSeller = currentUser?.id === order?.sellerId;
  const isFunded = ['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'DISPUTED', 'COMPLETED'].includes(order?.status);
  const canDeliver = isSeller && ['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(order?.status);
  const canApprove = isClient && order?.status === 'DELIVERED';

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setChatOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    API.get(`/orders/${orderId}`)
      .then(res => {
        if (res.data) setOrder(res.data);
      })
      .catch(() => {});

    API.get(`/orders/${orderId}/messages`)
      .then(res => {
        setChatMessages(
          res.data.map(m => ({
            id: m.id,
            senderId: m.senderId,
            sender: m.sender?.fullName || 'User',
            text: m.content,
            fileUrl: m.fileUrl
          }))
        );
      })
      .catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !currentUser?.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketBaseUrl =
      import.meta.env.DEV
        ? `http://${window.location.hostname}:5000`
        : (import.meta.env.VITE_SOCKET_URL ||
           import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
           'https://student-marketplace-kg2f.onrender.com');

    const socket = createSocket(socketBaseUrl, {
      auth: {
        token
      }
    });

    const handleNewMessage = (message) => {
      if (!message || message.orderId !== orderId) return;

      setChatMessages(prev => {
        const messageId = message.id;
        if (messageId && prev.some(item => item.id === messageId)) {
          return prev;
        }

        return [
          ...prev,
          {
            id: message.id,
            senderId: message.senderId,
            sender: message.sender?.fullName || (
              message.senderId === currentUser.id ? 'You' : 'User'
            ),
            text: message.content || '',
            fileUrl: message.fileUrl || null
          }
        ];
      });
    };

    const handleMessageBlocked = (data) => {
      setChatWarning(
        data?.warning ||
        'This message was blocked by the safety filter.'
      );
      setTimeout(() => setChatWarning(''), 6000);
    };

    socket.on('connect', () => {
      socket.emit('join_order_room', orderId);
    });

    socket.on('new_message', handleNewMessage);
    socket.on('message_blocked', handleMessageBlocked);

    socket.on('connect_error', (error) => {
      setChatWarning(
        error?.message || 'Realtime chat connection failed.'
      );
      setTimeout(() => setChatWarning(''), 6000);
    });

    socket.on('order_room_denied', (data) => {
      setChatWarning(
        data?.error || 'You are not authorized to access this order.'
      );
      setTimeout(() => setChatWarning(''), 6000);
    });

    socket.on('message_error', (data) => {
      setChatWarning(
        data?.error || 'Failed to send message.'
      );
      setTimeout(() => setChatWarning(''), 6000);
    });

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_blocked', handleMessageBlocked);
      socket.disconnect();
    };
  }, [orderId, currentUser?.id]);

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

  const handleCompletePayment = async () => {
    if (!isClient || order?.status !== 'PENDING_PAYMENT' || !order?.razorpayOrderId) {
      return;
    }

    setPaymentError('');
    setPaymentBusy(true);

    try {
      const isLoaded = await loadRazorpay();

      if (!isLoaded) {
        setPaymentError('Payment gateway could not be loaded. Please try again.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key',
        amount: Math.round(Number(order.totalAmount || 0) * 100),
        currency: 'INR',
        name: 'SkillLaunch Escrow',
        description: projectTitle,
        order_id: order.razorpayOrderId,
        handler: async (response) => {
          try {
            await API.post(`/orders/${order.id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            const refreshed = await API.get(`/orders/${orderId}`);
            if (refreshed.data) {
              setOrder(refreshed.data);
            }
          } catch (verifyErr) {
            console.error('Order payment verification failed:', verifyErr);
            setPaymentError(
              verifyErr?.response?.data?.error ||
              'Payment was received, but verification could not be completed.'
            );
          } finally {
            setPaymentBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentBusy(false);
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
        setPaymentError(
          response?.error?.description ||
          'The payment was not completed.'
        );
        setPaymentBusy(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Order payment initialization failed:', err);
      setPaymentError(
        err?.response?.data?.error ||
        'Unable to start payment. Please try again.'
      );
      setPaymentBusy(false);
    }
  };

  const handleDeliver = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/orders/${orderId}/deliver`, { driveLinks: [deliverLink], message: deliverNote });
      alert('Work submitted! 5-day client review timer started.');
      confetti();
      window.location.reload();
    } catch (err) {
      alert('Error submitting work.');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve work and release escrow payout?')) return;
    try {
      const res = await API.post(`/orders/${orderId}/approve`);
      confetti({ particleCount: 200, spread: 100 });
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      alert('Error approving order.');
    }
  };


  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) {
      alert('Please describe the changes required.');
      return;
    }

    try {
      const res = await API.post(`/orders/${orderId}/request-revision`, {
        reason: revisionReason.trim()
      });

      alert(res.data.message || 'Revision requested successfully.');
      setShowRevisionModal(false);
      setRevisionReason('');
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to request revision.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (order?.status !== 'COMPLETED') {
      alert('Reviews can only be submitted after the order is completed.');
      return;
    }

    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 10) {
      alert('Please write at least 10 characters about your experience.');
      return;
    }

    try {
      setSubmittingReview(true);

      await API.post(`/reviews/${orderId}`, {
        overallRating: Number(reviewForm.overallRating),
        communicationRating: Number(reviewForm.communicationRating),
        qualityRating: Number(reviewForm.qualityRating),
        timelinessRating: Number(reviewForm.timelinessRating),
        comment: reviewForm.comment.trim()
      });

      alert('Review submitted successfully.');
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please enter a dispute reason.');
      return;
    }

    try {
      const res = await API.post('/disputes', {
        orderId,
        reason: disputeReason,
        evidence: disputeEvidence
      });

      alert(res.data.message || 'Dispute opened successfully.');
      setShowDisputeModal(false);
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to open dispute.');
    }
  };

  const handleChatAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Attachment must be 25 MB or smaller.');
      return;
    }

    try {
      setChatUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setChatAttachment({
        name: file.name,
        url: res.data.url
      });
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to upload attachment.');
    } finally {
      setChatUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!chatInput.trim() && !chatAttachment?.url) return;

    const leakPattern = /(phone|call|whatsapp|gpay|paytm|upi|telegram|@|\b\d{10}\b)/i;
    if (chatInput.trim() && leakPattern.test(chatInput)) {
      setChatWarning('🚨 AI Safety Alert: Message blocked. Sharing contact numbers or external payments violates safety rules.');
      setTimeout(() => setChatWarning(''), 6000);
      setChatInput('');
      return;
    }

    try {
      const res = await API.post(`/orders/${orderId}/messages`, {
        content: chatInput,
        fileUrl: chatAttachment?.url || null
      });

      setChatInput('');
      setChatAttachment(null);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to send message');
    }
  };

  const statusMeta = {
    PENDING_PAYMENT: {
      label: 'Payment Pending',
      tone: 'amber',
      step: 0,
      next: isClient ? 'Complete payment to secure the project.' : 'Awaiting client payment.'
    },
    FUNDED_IN_ESCROW: {
      label: 'Funded in Escrow',
      tone: 'emerald',
      step: 1,
      next: isSeller ? 'Review the scope and start the project.' : 'Project secured in escrow; work is ready to begin.'
    },
    REQUIREMENTS_SUBMITTED: {
      label: 'Requirements Submitted',
      tone: 'cyan',
      step: 2,
      next: isSeller ? 'Continue working and prepare the delivery.' : 'Requirements are being worked on.'
    },
    IN_PROGRESS: {
      label: 'In Progress',
      tone: 'cyan',
      step: 2,
      next: isSeller ? 'Continue the work and submit deliverables when ready.' : 'Track progress and collaborate with the freelancer.'
    },
    DELIVERED: {
      label: 'Delivered',
      tone: 'violet',
      step: 3,
      next: isClient ? 'Review the submitted deliverables.' : 'Awaiting client review.'
    },
    REVISION_REQUESTED: {
      label: 'Revision Requested',
      tone: 'amber',
      step: 2,
      next: isSeller ? 'Address the revision request and resubmit.' : 'Waiting for the revised delivery.'
    },
    COMPLETED: {
      label: 'Completed',
      tone: 'emerald',
      step: 5,
      next: 'Project completed and payment released.'
    },
    DISPUTED: {
      label: 'Disputed',
      tone: 'red',
      step: 4,
      next: 'Review the dispute case and its resolution status.'
    },
    CANCELLED_REFUNDED: {
      label: 'Cancelled / Refunded',
      tone: 'slate',
      step: 0,
      next: 'This order is no longer active.'
    }
  };

  const meta = statusMeta[order?.status] || {
    label: 'Loading',
    tone: 'slate',
    step: 0,
    next: 'Loading workspace state...'
  };

  const progressSteps = [
    'Payment',
    'Escrow',
    'In Progress',
    'Delivered',
    'Review',
    'Completed'
  ];

  const toneClasses = {
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    slate: 'border-slate-700 bg-slate-800/40 text-slate-300'
  };

  const projectTitle =
    order?.job?.title ||
    order?.gig?.title ||
    order?.GigPackage?.tierName ||
    `Order #${orderId?.slice(0, 8)}`;

  const daysRemaining = order?.deadline
    ? Math.ceil((new Date(order.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const reviewHoursRemaining = order?.autoApproveAt && order?.status === 'DELIVERED'
    ? Math.max(0, Math.ceil((new Date(order.autoApproveAt).getTime() - Date.now()) / 3600000))
    : null;

  const reviewDeadlineLabel = order?.autoApproveAt
    ? new Date(order.autoApproveAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div className="space-y-6 pb-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal</span>
      </Link>

      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-400">
              Order Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-2 break-words">
              {projectTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-slate-400">
              <span>Order #{orderId?.slice(0, 8)}</span>
              <span>•</span>
              <span>{isClient ? 'Client view' : isSeller ? 'Freelancer view' : 'Administrator view'}</span>
            </div>
          </div>

          <div className="flex flex-wrap lg:justify-end gap-3">
            {(isClient || isSeller) && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="px-4 py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors flex items-center gap-2"
                aria-label="Open collaboration chat"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Chat
                </span>
              </button>
            )}

            <div className={`px-4 py-3 rounded-2xl border ${toneClasses[meta.tone]}`}>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-70">
                Current Status
              </div>
              <div className="text-sm font-black mt-1">{meta.label}</div>
            </div>

            <div className="px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/70">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                Escrow
              </div>
              <div className="text-sm font-black text-white mt-1">
                {order?.totalAmount != null ? `₹${Number(order.totalAmount).toLocaleString('en-IN')}` : '—'}
              </div>
              <div className="text-sm text-slate-400 mt-0.5">
                {order?.status === 'COMPLETED'
                  ? 'Payout released'
                  : order?.status === 'CANCELLED_REFUNDED'
                    ? 'Order closed'
                    : isFunded
                      ? 'Held in escrow'
                      : 'Payment pending'}
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/70">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                Deadline
              </div>
              <div className="text-sm font-black text-white mt-1">
                {order?.deadline
                  ? new Date(order.deadline).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '—'}
              </div>
              <div className={`text-[10px] mt-0.5 ${daysRemaining != null && daysRemaining < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {daysRemaining == null
                  ? 'No deadline available'
                  : daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} day(s) overdue`
                    : `${daysRemaining} day(s) remaining`}
              </div>
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${
          order?.status === 'COMPLETED'
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : order?.status === 'DISPUTED'
              ? 'border-red-500/20 bg-red-500/5'
              : 'border-indigo-500/20 bg-indigo-500/5'
        }`}>
          <div className={`text-[10px] font-black uppercase tracking-widest ${
            order?.status === 'COMPLETED'
              ? 'text-emerald-300'
              : order?.status === 'DISPUTED'
                ? 'text-red-300'
                : 'text-indigo-300'
          }`}>
            {order?.status === 'COMPLETED' ? 'Transaction Complete' : 'Action Required'}
          </div>
          <div className="text-lg font-black text-white mt-1">{meta.next}</div>

          <div className="flex flex-wrap gap-3 mt-4">
            {canDeliver && (
              <button
                type="button"
                onClick={() => document.getElementById('delivery-center')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 py-3 neon-airflow-btn text-white text-sm font-black rounded-xl"
              >
                Submit Deliverables
              </button>
            )}

            {canApprove && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-black rounded-xl"
                >
                  Approve & Release
                </button>

                <button
                  type="button"
                  onClick={() => setShowRevisionModal(true)}
                  className="px-5 py-3 border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-black rounded-xl"
                >
                  Request Revision
                </button>
              </>
            )}

            {isClient && order?.status === 'PENDING_PAYMENT' && (
              <>
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={paymentBusy || !order?.razorpayOrderId}
                  className="px-5 py-3 neon-airflow-btn text-white text-sm font-black rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentBusy ? 'Opening Payment…' : 'Complete Payment'}
                </button>

                <div className="px-5 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm font-bold text-amber-300">
                  Payment required to continue
                </div>
              </>
            )}

            {paymentError && (
              <div className="w-full basis-full px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-bold text-red-300">
                {paymentError}
              </div>
            )}
          </div>
        </div>

        {isSeller && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <ClipboardCheck className="w-4 h-4" />
                Your next step
              </div>
              <div className="text-sm font-black text-white mt-2">{meta.next}</div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                <Wallet className="w-4 h-4" />
                Expected earnings
              </div>
              <div className="text-2xl font-black text-emerald-300 mt-1">
                ₹{Number(order?.sellerEarnings || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {order?.status === 'COMPLETED' ? 'Payout finalized' : isFunded ? 'Secured for this order' : 'Awaiting payment'}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock3 className="w-4 h-4" />
                {order?.status === 'DELIVERED' ? 'Client review' : 'Delivery deadline'}
              </div>
              <div className={`text-xl font-black mt-1 ${
                order?.status === 'DELIVERED'
                  ? 'text-amber-300'
                  : daysRemaining != null && daysRemaining < 0
                    ? 'text-red-300'
                    : 'text-white'
              }`}>
                {order?.status === 'DELIVERED'
                  ? reviewHoursRemaining == null
                    ? 'Awaiting review'
                    : reviewHoursRemaining < 24
                      ? `${reviewHoursRemaining}h remaining`
                      : `${Math.ceil(reviewHoursRemaining / 24)}d remaining`
                  : daysRemaining == null
                    ? 'No deadline'
                    : daysRemaining < 0
                      ? `${Math.abs(daysRemaining)}d overdue`
                      : `${daysRemaining}d remaining`}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {order?.status === 'DELIVERED' && reviewDeadlineLabel
                  ? `Auto-approval target: ${reviewDeadlineLabel}`
                  : order?.deadline
                    ? `Due ${new Date(order.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                    : 'Plan your delivery from the scope above.'}
              </div>
            </div>
          </section>
        )}

        {isSeller && order?.status === 'REVISION_REQUESTED' && (
          <section className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">Revision action required</div>
                <div className="text-base font-black text-white mt-1">Address the client feedback, then submit a new delivery version.</div>
                <p className="text-sm leading-6 text-slate-300 mt-2 whitespace-pre-wrap">
                  {order?.deliverables?.[0]?.revisionReason || 'Review the latest client feedback in the Delivery Center before resubmitting.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {isSeller && order?.status === 'DELIVERED' && (
          <section className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <Clock3 className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">Client review in progress</div>
                <div className="text-base font-black text-white mt-1">Your delivery is submitted. No further action is required unless the client requests a revision.</div>
                <p className="text-sm text-slate-400 mt-2">
                  If the client does not act before the review deadline, the order can proceed through the automatic approval flow.
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="pt-5 border-t border-slate-800">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            Order Information
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Order ID</div>
              <div className="text-sm font-bold text-slate-300 mt-1 break-all">{order?.id || orderId || '—'}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Category</div>
              <div className="text-sm font-bold text-slate-300 mt-1">
                {order?.job?.category || order?.gig?.category || 'Not specified'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Created</div>
              <div className="text-sm font-bold text-slate-300 mt-1">
                {order?.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '—'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Project Type</div>
              <div className="text-sm font-bold text-slate-300 mt-1">
                {order?.job?.projectType
                  ? String(order.job.projectType).replace(/_/g, ' ')
                  : order?.gig
                    ? 'Freelance Service'
                    : 'Project'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                Project Progress
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {meta.label}
              </div>
            </div>
            <div className="text-sm font-bold text-slate-400">
              Step {Math.min(meta.step + 1, progressSteps.length)} / {progressSteps.length}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {progressSteps.map((step, index) => {
              const complete = meta.step > index;
              const current = meta.step === index;

              return (
                <div
                  key={step}
                  className={`rounded-xl border px-3 py-3 ${
                    current
                      ? 'border-indigo-500/40 bg-indigo-500/10'
                      : complete
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mb-2 ${
                    current
                      ? 'bg-indigo-500 text-white'
                      : complete
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                  }`}>
                    {complete ? '✓' : index + 1}
                  </div>
                  <div className={`text-sm font-black ${
                    current ? 'text-white' : complete ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-lg font-black text-white">Project Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">Authoritative project context</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                  Description
                </div>
                <p className="text-base leading-7 text-slate-300 whitespace-pre-wrap">
                  {order?.job?.description || order?.gig?.description || 'No project description provided.'}
                </p>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                  Requirements / Scope
                </div>
                <p className="text-base leading-7 text-slate-300 whitespace-pre-wrap">
                  {order?.job?.requirements || order?.requirements || 'No additional requirements recorded.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(order?.job?.skills?.length ? order.job.skills : []).map(skill => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                        {skill}
                      </span>
                    ))}
                    {!order?.job?.skills?.length && (
                      <span className="text-xs text-slate-500">No skills specified.</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Deliverables
                  </div>
                  <p className="text-sm text-slate-300">
                    {order?.job?.deliverables?.length
                      ? order.job.deliverables.join(', ')
                      : 'No deliverable scope recorded yet.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    References
                  </div>
                  {order?.job?.referenceLinks?.length ? (
                    <div className="space-y-2">
                      {order.job.referenceLinks.map(link => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-indigo-400 hover:underline break-all"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      No reference links provided.
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Attachments / External Links
                  </div>
                  <div className="space-y-2">
                    {order?.job?.attachmentUrls?.length ? (
                      order.job.attachmentUrls.map(link => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-indigo-400 hover:underline break-all"
                        >
                          Attachment: {link}
                        </a>
                      ))
                    ) : null}

                    {order?.job?.externalLinks?.length ? (
                      order.job.externalLinks.map(link => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-cyan-400 hover:underline break-all"
                        >
                          External: {link}
                        </a>
                      ))
                    ) : null}

                    {!order?.job?.attachmentUrls?.length && !order?.job?.externalLinks?.length && (
                      <div className="text-xs text-slate-500">
                        No attachments or external links provided.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="delivery-center" className="glass-panel p-6 rounded-3xl border border-slate-800">
            {order?.status === 'REVISION_REQUESTED' && isSeller && (
              <div className="mb-5 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Revision Requested
                </div>
                <div className="text-sm font-black text-white mt-2">
                  Delivery version {order?.deliverables?.[0]?.version || '—'} needs changes
                </div>
                <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">
                  {order?.deliverables?.[0]?.revisionReason || 'The client requested changes to the submitted work.'}
                </p>
              </div>
            )}

            {canDeliver ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <h2 className="text-sm font-black text-white">
                    {order?.status === 'REVISION_REQUESTED'
                      ? 'Resubmit Revised Deliverables'
                      : 'Delivery Center'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {order?.status === 'REVISION_REQUESTED'
                      ? 'Submit a new delivery version addressing the client’s requested changes.'
                      : 'Submit your completed project for client review.'}
                  </p>
                </div>
                <form onSubmit={handleDeliver} className="space-y-3">
                  <input
                    required
                    type="url"
                    value={deliverLink}
                    onChange={e => setDeliverLink(e.target.value)}
                    placeholder="Google Drive / GitHub Deliverable Link"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white"
                  />
                  <textarea
                    rows="3"
                    value={deliverNote}
                    onChange={e => setDeliverNote(e.target.value)}
                    placeholder="Delivery notes..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 neon-airflow-btn text-white text-sm font-black rounded-xl"
                  >
                    Submit Deliverables
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-black text-white mb-3">Delivery Center</h2>
                {order?.deliverables?.length ? (
                  <div className="space-y-3">
                    {order.deliverables.map((d, index) => {
                      const version = d.version ?? order.deliverables.length - index;
                      const isLatest = index === 0;
                      const status = d.reviewStatus || 'PENDING_REVIEW';
                      const statusLabel = String(status)
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, c => c.toUpperCase());

                      const statusClass = status === 'REVISION_REQUESTED'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : status === 'APPROVED'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : status === 'DISPUTE_RESOLVED' || status === 'DISPUTED'
                            ? 'border-red-500/30 bg-red-500/10 text-red-300'
                            : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300';

                      return (
                        <div
                          key={d.id || index}
                          className={`relative p-5 rounded-2xl border ${
                            isLatest
                              ? 'bg-indigo-500/5 border-indigo-500/20'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          {index < order.deliverables.length - 1 && (
                            <div className="absolute left-5 top-full h-3 border-l border-dashed border-slate-700" />
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                                  Delivery Version {version}
                                </div>
                                {isLatest && (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                                    Latest
                                  </span>
                                )}
                              </div>

                              <div className="text-sm font-black text-white mt-2">
                                {status === 'REVISION_REQUESTED'
                                  ? 'Changes requested on this delivery'
                                  : status === 'APPROVED'
                                    ? 'Delivery approved'
                                    : 'Delivery submitted for review'}
                              </div>

                              <div className="text-sm text-slate-500 mt-1">
                                Submitted {d.submittedAt
                                  ? new Date(d.submittedAt).toLocaleString('en-IN')
                                  : '—'}
                              </div>
                            </div>

                            <span className={`self-start px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                              Delivery Notes
                            </div>
                            <div className="text-base leading-7 text-slate-300 whitespace-pre-wrap">
                              {d.message || 'No delivery notes provided.'}
                            </div>
                          </div>

                          {d.revisionReason && (
                            <div className="mt-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                              <div className="text-xs font-black uppercase tracking-widest text-amber-300">
                                Revision Reason
                              </div>
                              <div className="text-sm leading-6 text-slate-300 mt-1 whitespace-pre-wrap">
                                {d.revisionReason}
                              </div>
                            </div>
                          )}

                          {d.driveLinks?.length > 0 && (
                            <div className="mt-4">
                              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                Links
                              </div>
                              <div className="space-y-1">
                                {d.driveLinks.map(link => (
                                  <a
                                    key={link}
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-xs text-indigo-400 hover:underline break-all"
                                  >
                                    {link}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {d.fileUrls?.length > 0 && (
                            <div className="mt-4">
                              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                Files
                              </div>
                              <div className="space-y-1">
                                {d.fileUrls.map(file => (
                                  <a
                                    key={file}
                                    href={file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-xs text-cyan-400 hover:underline break-all"
                                  >
                                    {file}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-xs text-slate-500">
                    No deliverables submitted yet.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h2 className="text-sm font-black text-white mb-4">Participants</h2>

            <div className="space-y-3">
              {[
                { label: 'Client', user: order?.client },
                { label: 'Freelancer', user: order?.seller }
              ].map(({ label, user }) => (
                <div key={label} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {label}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {user?.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300">
                        {user?.fullName?.slice(0, 2)?.toUpperCase() || '—'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate">
                        {user?.fullName || 'Unknown user'}
                      </div>
                      <div className="text-sm text-slate-400 truncate">
                        {user?.username ? `@${user.username}` : user?.profile?.tagline || 'Marketplace participant'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="p-2.5 rounded-xl bg-slate-900">
                      <div className="text-slate-500">Rating</div>
                      <div className="font-black text-white mt-1">
                        {Number(user?.averageRating || 0).toFixed(1)} / 5
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900">
                      <div className="text-slate-500">Reviews</div>
                      <div className="font-black text-white mt-1">
                        {user?.totalReviews || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h2 className="text-lg font-black text-white mb-4">Payment Center</h2>

            <div className="space-y-3 text-base">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Project price</span>
                <span className="font-black text-white">
                  ₹{Number(order?.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Platform fee</span>
                <span className="font-bold text-slate-300">
                  ₹{Number(order?.platformFee || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-slate-800 pt-3">
                <span className="text-slate-400">Freelancer earnings</span>
                <span className="font-black text-emerald-300">
                  ₹{Number(order?.sellerEarnings || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${
                order?.status === 'PENDING_PAYMENT'
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                  : order?.status === 'CANCELLED_REFUNDED'
                    ? 'bg-slate-800/40 border-slate-700 text-slate-300'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="font-black">Payment Lifecycle</div>
                <div className="mt-1">
                  {order?.status === 'PENDING_PAYMENT'
                    ? 'Payment is pending verification.'
                    : order?.status === 'CANCELLED_REFUNDED'
                      ? 'Order is cancelled/refunded.'
                      : order?.status === 'DISPUTED'
                        ? 'Order is disputed; funds remain subject to the dispute outcome.'
                        : order?.status === 'COMPLETED'
                          ? 'Escrow has been released and the payout has been finalized.'
                          : order?.transfer?.status === 'RELEASED'
                            ? 'Escrow released to the freelancer.'
                            : 'Payment verified and funds are secured in escrow.'}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Payment provider</span>
                  <span className="font-bold text-slate-300">Razorpay</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Gateway order</span>
                  <span className="font-bold text-slate-300 text-right break-all">
                    {order?.razorpayOrderId || 'Not available'}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Payment reference</span>
                  <span className="font-bold text-slate-300 text-right break-all">
                    {order?.razorpayPaymentId || 'Not available'}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Transfer status</span>
                  <span className={`font-black ${
                    order?.transfer?.status === 'RELEASED'
                      ? 'text-emerald-300'
                      : order?.transfer
                        ? 'text-amber-300'
                        : 'text-slate-500'
                  }`}>
                    {order?.transfer
                      ? order.transfer.status || 'PENDING'
                      : 'No transfer record'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h2 className="text-lg font-black text-white mb-4">Financial Outcome</h2>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                Current Outcome
              </div>

              <div className="text-sm font-black text-white mt-2">
                {order?.status === 'COMPLETED'
                  ? 'Order completed and payout finalized.'
                  : order?.status === 'CANCELLED_REFUNDED'
                    ? 'Order cancelled; refund outcome has been recorded locally.'
                    : order?.status === 'DISPUTED'
                      ? 'Financial outcome is pending dispute resolution.'
                      : order?.status === 'PENDING_PAYMENT'
                        ? 'Awaiting payment verification.'
                        : order?.transfer?.status === 'RELEASED'
                          ? 'Escrow transfer has been released to the freelancer.'
                          : isFunded
                            ? 'Funds are secured in escrow.'
                            : 'Financial outcome is not yet available.'}
              </div>

              <div className="mt-3 text-sm leading-6 text-slate-400">
                This summary reflects the order state and any persisted transfer record. It does not infer a gateway refund or transfer when no corresponding record exists.
              </div>
            </div>
          </section>

          {order?.status === 'COMPLETED' && (
            <section className="glass-panel p-6 rounded-3xl border border-slate-800">
              <h2 className="text-sm font-black text-white mb-4">Completion Center</h2>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-300">
                  Transaction Complete
                </div>

                <div className="text-sm font-black text-white mt-2">
                  Order completed successfully.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div>
                    <div className="text-slate-500">Order ID</div>
                    <div className="text-slate-200 font-bold break-all mt-1">{order.id}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Total paid</div>
                    <div className="text-white font-black mt-1">
                      ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Freelancer payout</div>
                    <div className="text-emerald-300 font-black mt-1">
                      ₹{Number(order.sellerEarnings || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Payment reference</div>
                    <div className="text-slate-200 font-bold break-all mt-1">
                      {order.razorpayPaymentId || 'Not available'}
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                const myReview = order?.reviews?.find(
                  review => review.reviewerId === currentUser?.id
                );

                return myReview ? (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Your Review
                    </div>
                    <div className="text-sm font-black text-white mt-2">
                      {myReview.overallRating}/5 overall
                    </div>
                    <p className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">
                      {myReview.comment}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-300">
                      Leave Your Review
                    </div>

                    {[
                      ['overallRating', 'Overall'],
                      ['communicationRating', 'Communication'],
                      ['qualityRating', 'Quality'],
                      ['timelinessRating', 'Timeliness']
                    ].map(([field, label]) => (
                      <label key={field} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-400">{label}</span>
                        <select
                          value={reviewForm[field]}
                          onChange={e => setReviewForm(prev => ({
                            ...prev,
                            [field]: Number(e.target.value)
                          }))}
                          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                        >
                          {[5, 4, 3, 2, 1].map(value => (
                            <option key={value} value={value}>{value}/5</option>
                          ))}
                        </select>
                      </label>
                    ))}

                    <textarea
                      rows="4"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(prev => ({
                        ...prev,
                        comment: e.target.value
                      }))}
                      placeholder="Describe your experience with this order..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-3 neon-airflow-btn text-white text-sm font-black rounded-xl disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                    </button>
                  </form>
                );
              })()}
            </section>
          )}

          {(isClient || isSeller) && (
            <section className="glass-panel p-6 rounded-3xl border border-slate-800">
              <h2 className="text-sm font-black text-white mb-4">Protection</h2>

              {order?.dispute && (
                <div className="mb-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-red-300">
                        Dispute Case
                      </div>
                      <div className="text-sm font-black text-white mt-1">
                        {order.dispute.status || 'OPEN'}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 text-right">
                      Opened {order.dispute.createdAt
                        ? new Date(order.dispute.createdAt).toLocaleString('en-IN')
                        : '—'}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Reason
                      </div>
                      <div className="text-slate-300 mt-1 whitespace-pre-wrap">
                        {order.dispute.reason || 'No reason provided.'}
                      </div>
                    </div>

                    {order.dispute.evidence && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Evidence
                        </div>
                        <a
                          href={order.dispute.evidence}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-indigo-400 hover:underline break-all mt-1"
                        >
                          {order.dispute.evidence}
                        </a>
                      </div>
                    )}

                    {order.dispute.sellerReason && (
                      <div className="pt-3 border-t border-slate-800">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Freelancer Response
                        </div>
                        <div className="text-slate-300 mt-1 whitespace-pre-wrap">
                          {order.dispute.sellerReason}
                        </div>
                      </div>
                    )}

                    {order.dispute.sellerEvidence && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Freelancer Evidence
                        </div>
                        <a
                          href={order.dispute.sellerEvidence}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-cyan-400 hover:underline break-all mt-1"
                        >
                          {order.dispute.sellerEvidence}
                        </a>
                      </div>
                    )}

                    {order.dispute.adminDecision && (
                      <div className="pt-3 border-t border-slate-800">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Resolution
                        </div>
                        <div className="text-white font-bold mt-1">
                          {order.dispute.adminDecision}
                        </div>
                        {order.dispute.resolvedAt && (
                          <div className="text-sm text-slate-500 mt-1">
                            Resolved {new Date(order.dispute.resolvedAt).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {canApprove && (
                <>
                  <button
                    onClick={handleApprove}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Release
                  </button>

                  <button
                    onClick={() => setShowRevisionModal(true)}
                    className="w-full py-3 mt-3 border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-black rounded-xl"
                  >
                    Request Revision
                  </button>
                </>
              )}

              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl mt-3 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Open Dispute
              </button>
            </section>
          )}
        </div>
      </div>

      <section className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 text-xs font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Activity Timeline</span>
        </div>

        <div className="p-5 bg-slate-950/40">
          {order?.activityEvents?.length ? (
            <div className="relative pl-6 space-y-5">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-800" />

              {[...order.activityEvents]
                .slice()
                .reverse()
                .map((event, index) => {
                  const isLatest = index === 0;
                  const eventSource = event.source
                    ? event.source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : 'System Activity';

                  return (
                    <div key={event.id || index} className="relative">
                      <div className={`absolute -left-[1.15rem] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 ${
                        isLatest ? 'bg-indigo-300' : 'bg-slate-600'
                      }`} />

                      <div className={`p-4 rounded-2xl border ${
                        isLatest
                          ? 'bg-indigo-500/5 border-indigo-500/20'
                          : 'bg-slate-950/50 border-slate-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${
                                isLatest ? 'text-indigo-300' : 'text-slate-500'
                              }`}>
                                {eventSource}
                              </span>

                              {isLatest && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                                  Latest
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-black text-white mt-2 leading-6">
                              {event.message}
                            </div>

                            <div className="text-sm text-slate-400 mt-1">
                              {event.actor?.fullName
                                ? `${event.actor.fullName}${event.actor.role ? ` · ${event.actor.role.replace(/_/g, ' ')}` : ''}`
                                : 'System'}
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 sm:text-right shrink-0">
                            {event.createdAt
                              ? new Date(event.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
              No activity has been recorded for this order yet.
            </div>
          )}
        </div>
      </section>

      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              Delivery Review
            </div>
            <h3 className="text-xl font-black text-white mt-2 mb-2">
              Request Revision
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Explain clearly what needs to change. The current delivery version will remain preserved in the workspace history.
            </p>

            <textarea
              rows="5"
              value={revisionReason}
              onChange={e => setRevisionReason(e.target.value)}
              placeholder="Describe the required changes..."
              className="w-full mb-4 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setRevisionReason('');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleRequestRevision}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-black text-white mb-4">Open Dispute</h3>

            <textarea
              rows="4"
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="Explain the issue..."
              className="w-full mb-3 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white"
            />

            <input
              type="text"
              value={disputeEvidence}
              onChange={e => setDisputeEvidence(e.target.value)}
              placeholder="Evidence link (optional)"
              className="w-full mb-4 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleOpenDispute}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
      {(isClient || isSeller) && (
        <>
          {!chatOpen && (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="fixed right-5 bottom-5 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-900/40 flex items-center justify-center transition-transform hover:scale-105"
              aria-label="Open collaboration chat"
              title="Open collaboration chat"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          )}

          {chatOpen && (
            <>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] cursor-default"
                aria-label="Minimize collaboration chat"
              />

              <section
                ref={chatPanelRef}
                className="fixed right-5 bottom-5 z-50 w-[min(430px,calc(100vw-2rem))] h-[min(640px,calc(100vh-8rem))] min-h-[420px] glass-panel rounded-3xl border border-slate-700 shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
              >
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        Collaboration Chat
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Order conversation
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    aria-label="Minimize chat"
                    title="Minimize chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-2 text-xs bg-slate-950/70">
                  {chatMessages.map((m, i) => {
                    const mine = m.senderId === currentUser?.id;
                    return (
                      <div key={i} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[78%] ${mine ? 'items-end' : 'items-start'}`}>
                          {!mine && (
                            <div className="text-[10px] mb-1 px-1 text-slate-400">
                              {m.sender}
                            </div>
                          )}

                          <div className={`p-2.5 rounded-2xl ${
                            mine
                              ? 'bg-indigo-600 text-white rounded-br-md'
                              : 'bg-slate-900 text-slate-300 rounded-bl-md'
                          }`}>
                            {m.text && (
                              <div className="whitespace-pre-wrap break-words">{m.text}</div>
                            )}

                            {m.fileUrl && (
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 flex items-center gap-2 text-[10px] font-bold underline break-all"
                              >
                                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                Open attachment
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {chatWarning && (
                    <div className="p-2 bg-red-500/20 text-red-300 rounded-xl text-xs">
                      {chatWarning}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-800 bg-slate-900 space-y-2 shrink-0"
                >
                  {chatAttachment && (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950 border border-indigo-500/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-[10px] text-slate-300 truncate">
                          {chatAttachment.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setChatAttachment(null)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        aria-label="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <label className={`px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-indigo-400 cursor-pointer ${
                      chatUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      <Paperclip className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleChatAttachmentChange}
                        disabled={chatUploading}
                      />
                    </label>

                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder={chatUploading ? 'Uploading attachment...' : 'Message...'}
                      disabled={chatUploading}
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={chatUploading || (!chatInput.trim() && !chatAttachment?.url)}
                      className="px-4 py-2 neon-airflow-btn text-white rounded-xl text-xs font-bold disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </>
      )}

    </div>
  );
}
