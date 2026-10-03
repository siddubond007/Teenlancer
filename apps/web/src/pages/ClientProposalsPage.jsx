import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, Users, ShieldCheck } from 'lucide-react';
import API from '../services/api';

export default function ClientProposalsPage() {
  const { projectId } = useParams();

  const [job, setJob] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uiModal, setUiModal] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    onConfirm: null
  });

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };


  const showModal = (config) => {
    setUiModal({
      open: true,
      type: config.type || 'info',
      title: config.title || 'SkillLaunch',
      message: config.message || '',
      confirmLabel: config.confirmLabel || 'OK',
      cancelLabel: config.cancelLabel || 'Cancel',
      onConfirm: config.onConfirm || null
    });
  };

  const closeModal = () => {
    setUiModal(prev => ({ ...prev, open: false, onConfirm: null }));
  };

  const refreshPageState = async () => {
    const [jobRes, ordersRes] = await Promise.all([
      API.get(`/jobs/${projectId}`),
      API.get('/orders')
    ]);
    setJob(jobRes.data);
    setOrders(ordersRes.data || []);
  };

  useEffect(() => {
    Promise.all([
      API.get(`/jobs/${projectId}`),
      API.get('/orders')
    ])
      .then(([jobRes, ordersRes]) => {
        setJob(jobRes.data);
        setOrders(ordersRes.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [projectId]);

  const updateProposalStatus = async (bidId, action) => {
    if (hasVerifiedHire) {
      showModal({
        type: 'warning',
        title: 'Freelancer Already Hired',
        message: 'A freelancer has already been hired for this project. The selected freelancer cannot be changed after payment verification.',
        confirmLabel: 'Understood'
      });
      return;
    }

    try {
      const res = await API.post(
        `/jobs/${projectId}/${action}/${bidId}`
      );

      await refreshPageState();

      showModal({
        type: 'success',
        title: action === 'shortlist-bid' ? 'Proposal Shortlisted' : 'Proposal Rejected',
        message: res.data?.message || 'Proposal updated successfully.',
        confirmLabel: 'Done'
      });
    } catch (err) {
      showModal({
        type: 'error',
        title: 'Action Failed',
        message: err?.response?.data?.error || 'Failed to update proposal.',
        confirmLabel: 'Close'
      });
    }
  };

  const hireStudent = async (bidId, amount) => {
    if (hasVerifiedHire) {
      showModal({
        type: 'warning',
        title: 'Freelancer Already Hired',
        message: 'This project already has a verified hired freelancer. A second freelancer cannot be hired for the same project.',
        confirmLabel: 'Understood'
      });
      return;
    }

    if (hasPendingPayment) {
      showModal({
        type: 'warning',
        title: 'Payment Still Pending',
        message: 'A payment attempt is already in progress for this project. Complete or cancel that checkout before starting another hiring attempt.',
        confirmLabel: 'Understood'
      });
      return;
    }

    const confirmed = await new Promise((resolve) => {
      showModal({
        type: 'warning',
        title: 'Important: Choose Carefully',
        message: `You are selecting this freelancer for ₹${amount}. Please review your choice carefully before continuing. Once payment is successfully verified and escrow is funded, this freelancer cannot be changed and another freelancer cannot be hired for this project.`,
        confirmLabel: 'Continue to Secure Payment',
        cancelLabel: 'Go Back',
        onConfirm: () => resolve(true)
      });
    });

    if (!confirmed) return;

    closeModal();

    try {
      const res = await API.post(`/jobs/${projectId}/accept-bid/${bidId}`);
      
      if (res.data?.checkoutRequired && res.data?.order?.razorpayOrderId) {
        let paymentFlowSettled = false;
        let cancellationStarted = false;

        const cancelPendingHiring = async () => {
          if (paymentFlowSettled || cancellationStarted) return;

          cancellationStarted = true;
          try {
            await API.post(`/jobs/${projectId}/cancel-hiring`);
          } catch (cancelErr) {
            console.error('Failed to cancel pending hiring reservation:', cancelErr);
          }
        };

        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          await cancelPendingHiring();
          showModal({
            type: 'error',
            title: 'Payment Gateway Unavailable',
            message: 'The payment gateway could not be loaded. Your hiring reservation has been released and the project remains available.',
            confirmLabel: 'Close'
          });
          await refreshPageState();
          return;
        }

        const refreshJob = async () => {
          try {
            const refreshed = await API.get(`/jobs/${projectId}`);
            setJob(refreshed.data);
          } catch (refreshErr) {
            console.error('Failed to refresh project state:', refreshErr);
          }
        };

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key',
          amount: Math.round(res.data.order.totalAmount * 100),
          currency: 'INR',
          name: 'SkillLaunch Escrow',
          description: `Project Funding: ${job?.title || 'Deliverables'}`,
          order_id: res.data.order.razorpayOrderId,
          handler: async function (response) {
            try {
              const verification = await API.post(
                `/orders/${res.data.order.id}/verify-payment`,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              );

              paymentFlowSettled = true;

              await refreshPageState();

              showModal({
                type: 'success',
                title: 'Freelancer Hired Successfully',
                message: verification.data?.message ||
                  'Payment verified successfully. Escrow is funded and the freelancer is now hired for this project.',
                confirmLabel: 'Done'
              });
            } catch (verifyErr) {
              console.error('Razorpay verification failed:', verifyErr);

              showModal({
                type: 'warning',
                title: 'Payment Received — Verification Pending',
                message:
                  verifyErr?.response?.data?.error ||
                  'Razorpay reported the payment, but SkillLaunch could not verify it immediately. The project will not be marked as hired until payment verification succeeds.',
                confirmLabel: 'Close'
              });

              await refreshPageState();
            }
          },
          modal: {
            ondismiss: async function () {
              if (paymentFlowSettled) return;

              await cancelPendingHiring();
              await refreshPageState();
              showModal({
                type: 'info',
                title: 'Hiring Attempt Cancelled',
                message: 'No freelancer was hired. The project is available again, and you may choose the same freelancer or another proposal.',
                confirmLabel: 'Got It'
              });
            }
          },
          prefill: {
            name: 'Client Account',
            email: 'client@skilllaunch.com'
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', async function (response) {
          await cancelPendingHiring();
          await refreshPageState();
          showModal({
            type: 'error',
            title: 'Payment Failed',
            message: (response?.error?.description || 'The payment was not completed.') + ' No freelancer was hired, and the project remains available.',
            confirmLabel: 'Close'
          });
        });

        rzp.open();
      } else {
         // Fallback if no checkout required (e.g., zero amount or testing)
         await refreshPageState();
         showModal({
           type: 'success',
           title: 'Hiring Completed',
           message: res.data?.message || 'The freelancer has been hired successfully.',
           confirmLabel: 'Done'
         });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showModal({
        type: 'error',
        title: 'Hiring Failed',
        message: err?.response?.data?.error || 'Failed to initialize escrow funding. No freelancer has been hired.',
        confirmLabel: 'Close'
      });
      try {
        await refreshPageState();
      } catch (refreshErr) {
        console.error('Failed to refresh hiring state:', refreshErr);
      }
    }
  };

  const pendingPaymentOrder = orders.find(
    order => order.jobId === projectId && order.status === 'PENDING_PAYMENT'
  );

  const hasPendingPayment = Boolean(pendingPaymentOrder);

  const hasVerifiedHire = Boolean(
    job &&
    ['IN_PROGRESS', 'COMPLETED'].includes(String(job.status || '').toUpperCase())
  ) || orders.some(
    order =>
      order.jobId === projectId &&
      ['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'IN_REVIEW', 'DISPUTED', 'COMPLETED'].includes(order.status)
  );

  const hasActiveHiringLock = hasPendingPayment || hasVerifiedHire;

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        Loading proposals...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 text-white">
        Project not found
      </div>
    );
  }

  const bids = job.bids || [];
  const proposalPriority = {
    SHORTLISTED: 0,
    PENDING: 1,
    HIRED: 2,
    REJECTED: 3
  };
  const sortedBids = [...bids].sort((a, b) => {
    const aPriority = proposalPriority[String(a.status || 'PENDING').toUpperCase()] ?? 99;
    const bPriority = proposalPriority[String(b.status || 'PENDING').toUpperCase()] ?? 99;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const pendingCount = bids.filter((bid) => bid.status === 'PENDING').length;
  const shortlistedCount = bids.filter((bid) => bid.status === 'SHORTLISTED').length;
  const rejectedCount = bids.filter((bid) => bid.status === 'REJECTED').length;
  const hiredCount = bids.filter((bid) => bid.status === 'HIRED').length;

  const projectStatus = String(job.status || '').toUpperCase();
  const orderStatus = pendingPaymentOrder?.status || (
    orders.find((order) => order.jobId === projectId && order.status !== 'CANCELLED_REFUNDED')?.status
  );

  const getWorkflowBanner = () => {
    if (hasVerifiedHire) {
      return {
        label: 'Hiring locked',
        title: 'Freelancer hired — project is now in progress',
        message: 'Payment has been verified and the selected freelancer cannot be changed from this proposal workspace.',
        className: 'border-emerald-400/20 bg-emerald-500/5',
        iconClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
      };
    }

    if (hasPendingPayment) {
      return {
        label: 'Payment pending',
        title: 'Complete payment to secure the selected freelancer',
        message: 'Your unpaid hiring reservation is still active. Return to the checkout flow to finish hiring or cancel the reservation.',
        className: 'border-amber-400/20 bg-amber-500/5',
        iconClass: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      };
    }

    if (projectStatus !== 'OPEN') {
      return {
        label: 'Project unavailable',
        title: 'This project is not currently accepting hiring actions',
        message: 'The project lifecycle has moved beyond active proposal review.',
        className: 'border-slate-700 bg-slate-950/40',
        iconClass: 'bg-slate-800 border-slate-700 text-slate-300'
      };
    }

    return {
      label: 'Hiring workspace',
      title: 'Compare proposals and choose the right student freelancer',
      message: 'Shortlist strong candidates first, review their profiles, then start the secure payment flow when you are ready to hire.',
      className: 'border-indigo-400/20 bg-indigo-500/5',
      iconClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
    };
  };

  const workflowBanner = getWorkflowBanner();

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-7 pb-16">

        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0">
              <Link
                to={`/my-projects/${projectId}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Project
              </Link>

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <BriefcaseBusiness className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-400">
                    Hiring Workspace
                  </p>
                  <h1 className="text-3xl md:text-4xl font-black text-white mt-1 break-words">
                    Proposals
                  </h1>
                  <p className="text-sm md:text-base text-slate-400 mt-1 break-words">
                    {job.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                to={`/my-projects/${projectId}`}
                className="w-full lg:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-black inline-flex items-center justify-center gap-2"
              >
                View Project
              </Link>
            </div>
          </div>
        </div>

        <div className={`glass-panel p-5 md:p-6 rounded-3xl border ${workflowBanner.className}`}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${workflowBanner.iconClass}`}>
              {hasVerifiedHire ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : hasPendingPayment ? (
                <Clock3 className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {workflowBanner.label}
              </p>
              <h2 className="text-xl font-black text-white mt-1">
                {workflowBanner.title}
              </h2>
              <p className="text-sm leading-6 text-slate-400 mt-1">
                {workflowBanner.message}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
              Proposal Summary
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-500">Total</p>
              <p className="text-xl font-black text-white mt-1">{bids.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-500">Pending</p>
              <p className="text-xl font-black text-white mt-1">{pendingCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-500">Shortlisted</p>
              <p className="text-xl font-black text-indigo-300 mt-1">{shortlistedCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-500">Hired</p>
              <p className="text-xl font-black text-emerald-300 mt-1">{hiredCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">
              {rejectedCount} Rejected
            </span>
            {orderStatus && (
              <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Order: {orderStatus.replaceAll('_', ' ')}
              </span>
            )}
          </div>
        </div>

      {!job.bids?.length ? (
        <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center">
          <h2 className="text-white text-xl font-bold">
            No proposals yet
          </h2>

          <p className="text-slate-400 mt-2">
            Student proposals will appear here.
          </p>
        </div>
      ) : (
        sortedBids.map(bid => {
          const bidStatus = String(bid.status || 'PENDING').toUpperCase();
          const bidStatusMeta = {
            PENDING: {
              label: 'Pending Review',
              className: 'bg-slate-800 border-slate-700 text-slate-300'
            },
            SHORTLISTED: {
              label: 'Shortlisted',
              className: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
            },
            REJECTED: {
              label: 'Rejected',
              className: 'bg-red-500/10 border-red-500/20 text-red-300'
            },
            HIRED: {
              label: 'Hired',
              className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }
          }[bidStatus] || {
            label: bidStatus,
            className: 'bg-slate-800 border-slate-700 text-slate-300'
          };

          return (
            <div
              key={bid.id}
              className="p-5 md:p-6 bg-slate-950/50 border border-slate-800 rounded-2xl"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Student Proposal
                    </span>
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-black ${bidStatusMeta.className}`}>
                      {bidStatusMeta.label}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white mt-2 break-words">
                    {bid.student?.fullName || 'Student'}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
                    <span>
                      Submitted {new Date(bid.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>Delivery · {bid.deliveryDays} days</span>
                  </div>
                </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-black text-amber-300">
                      {bid.student?.totalReviews > 0
                        ? `${Number(bid.student.averageRating || 0).toFixed(1)} ★`
                        : 'New'}
                      {bid.student?.totalReviews > 0 && (
                        <span className="text-slate-500 font-semibold ml-1">
                          ({bid.student.totalReviews})
                        </span>
                      )}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-black text-indigo-300">
                      {bid.student?.ordersAsSeller?.length || 0} completed
                    </span>

                    {bid.student?.verification?.status === 'APPROVED' && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-300">
                        ✓ Verified Student
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {bid.student?.profile?.category && (
                        <span className="text-xs font-bold text-slate-300">
                          {bid.student.profile.category}
                        </span>
                      )}

                      {bid.student?.profile?.college && (
                        <span className="text-xs text-slate-500">
                          · {bid.student.profile.college}
                        </span>
                      )}
                    </div>

                    {Array.isArray(bid.student?.profile?.skills) &&
                      bid.student.profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {bid.student.profile.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-5 py-3 lg:text-right shrink-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Proposed Price
                  </p>
                  <p className="text-2xl font-black text-indigo-300 mt-1">
                    ₹{Number(bid.proposedAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-900/50 border border-slate-800 p-4 md:p-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Cover Letter
                </h4>
                <p className="text-sm md:text-base leading-7 text-slate-300 whitespace-pre-wrap mt-2 break-words">
                  {bid.coverLetter || 'No cover letter provided.'}
                </p>
              </div>

              <div className="mt-5 flex gap-3 flex-wrap">

                {bidStatus === 'SHORTLISTED' ? (
                  <span className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-black">
                    ✓ Shortlisted
                  </span>
                ) : bidStatus === 'REJECTED' ? (
                  <span className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-black">
                    Proposal Rejected
                  </span>
                ) : bidStatus !== 'HIRED' ? (
                  <>
                    <button
                      disabled={hasActiveHiringLock}
                      onClick={() => updateProposalStatus(bid.id, 'shortlist-bid')}
                      className={`px-4 py-2.5 rounded-xl text-white text-sm font-black ${hasActiveHiringLock ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-60' : 'bg-amber-600 hover:bg-amber-500'}`}
                    >
                      Shortlist
                    </button>

                    <button
                      disabled={hasActiveHiringLock}
                      onClick={() => updateProposalStatus(bid.id, 'reject-bid')}
                      className={`px-4 py-2.5 rounded-xl text-white text-sm font-black ${hasActiveHiringLock ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-60' : 'bg-red-600 hover:bg-red-500'}`}
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {hasVerifiedHire ? (
                  <span className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded-xl text-sm font-black">
                    {bidStatus === 'HIRED' ? '✓ Hired for This Project' : 'Project Already Hired'}
                  </span>
                ) : hasPendingPayment ? (
                  <span className="px-4 py-2.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 rounded-xl text-sm font-black">
                    Payment Pending
                  </span>
                ) : ['PENDING', 'SHORTLISTED'].includes(bidStatus) ? (
                  <button
                    onClick={() => hireStudent(bid.id, bid.proposedAmount)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-black"
                  >
                    Hire Student
                  </button>

                ) : null}

                <Link
                  to={`/u/${bid.student?.id}`}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-black"
                >
                  View Student Profile
                </Link>

              </div>
            </div>
          );
        })
      )}

      </div>

      {uiModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="p-6">
              <div className={`text-xs font-black uppercase tracking-[0.18em] mb-2 ${
                uiModal.type === 'error'
                  ? 'text-red-400'
                  : uiModal.type === 'success'
                    ? 'text-emerald-400'
                    : uiModal.type === 'warning'
                      ? 'text-amber-400'
                      : 'text-indigo-400'
              }`}>
                SkillLaunch Notice
              </div>

              <h2 className="text-2xl font-black text-white">
                {uiModal.title}
              </h2>

              <p className="text-sm leading-6 text-slate-300 mt-3 whitespace-pre-line">
                {uiModal.message}
              </p>

              <div className="flex justify-end gap-3 mt-6">
                {uiModal.onConfirm && (
                  <button
                    type="button"
                    onClick={() => {
                      const confirmAction = uiModal.onConfirm;
                      closeModal();
                      confirmAction();
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black"
                  >
                    {uiModal.confirmLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-black"
                >
                  {uiModal.onConfirm ? uiModal.cancelLabel : uiModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
