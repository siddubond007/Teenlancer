import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, PlusCircle, PackageCheck, Edit3, Pause, Play, Copy, Archive } from 'lucide-react';
import API from '../services/api';

const stripHtmlForPreview = (value) =>
  String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const GIG_LIFECYCLE_META = {
  DRAFT: {
    label: 'Draft',
    description: 'Saved work that can still be edited.',
    className: 'bg-slate-500/10 border-slate-500/20 text-slate-300'
  },
  INCOMPLETE: {
    label: 'Incomplete',
    description: 'Required information still needs to be fixed.',
    className: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    description: 'Submitted and awaiting marketplace review.',
    className: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
  },
  PUBLISHED: {
    label: 'Published',
    description: 'Visible and orderable in the marketplace.',
    className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
  },
  PAUSED: {
    label: 'Paused',
    description: 'Saved but not accepting new orders.',
    className: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Submission was rejected by moderation.',
    className: 'bg-red-500/10 border-red-500/20 text-red-300'
  },
  NEEDS_CHANGES: {
    label: 'Needs Changes',
    description: 'Requested edits are needed before resubmission.',
    className: 'bg-orange-500/10 border-orange-500/20 text-orange-300'
  },
  ARCHIVED: {
    label: 'Archived',
    description: 'No longer active.',
    className: 'bg-slate-500/10 border-slate-500/20 text-slate-400'
  }
};


export default function StudentGigsPage({ currentUser }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState({});
  const [actionError, setActionError] = useState('');
  const [analyticsByGig, setAnalyticsByGig] = useState({});

  useEffect(() => {
    API.get('/gigs/mine')
      .then(async (res) => {
        const nextGigs = res.data || [];
        setGigs(nextGigs);

        const analyticsResults = await Promise.all(
          nextGigs
            .filter((gig) => ['PUBLISHED', 'PAUSED'].includes(gig.status))
            .map(async (gig) => {
              try {
                const response = await API.get(`/gigs/${gig.id}/analytics`);
                return [gig.id, response.data];
              } catch {
                return [gig.id, null];
              }
            })
        );

        setAnalyticsByGig(Object.fromEntries(analyticsResults));
      })
      .catch(() => {
        setGigs([]);
        setAnalyticsByGig({});
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const myGigs = useMemo(
    () => gigs.filter((gig) => gig.sellerId === currentUser?.id),
    [gigs, currentUser?.id]
  );

  const toggleGigAvailability = async (gig) => {
    const key = `${gig.id}:availability`;
    const currentAcceptingOrders =
      typeof gig.draftData?.delivery?.acceptingOrders === 'boolean'
        ? gig.draftData.delivery.acceptingOrders
        : true;
    const nextAcceptingOrders = !currentAcceptingOrders;
    const unavailableUntil =
      nextAcceptingOrders
        ? ''
        : String(gig.draftData?.delivery?.unavailableUntil || '').trim();

    setActionError('');
    setActionState((previous) => ({ ...previous, [key]: true }));

    try {
      const response = await API.put(`/gigs/${gig.id}/availability`, {
        acceptingOrders: nextAcceptingOrders,
        unavailableUntil
      });

      const updatedGig = response.data?.gig;

      if (updatedGig?.id) {
        setGigs((previous) =>
          previous.map((item) =>
            item.id === updatedGig.id
              ? {
                  ...item,
                  draftData: updatedGig.draftData,
                  updatedAt: updatedGig.updatedAt
                }
              : item
          )
        );
      }
    } catch (error) {
      setActionError(
        error?.response?.data?.error ||
          'Availability update failed. Please try again.'
      );
    } finally {
      setActionState((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const runGigAction = async (gig, action) => {
    const key = `${gig.id}:${action}`;
    setActionError('');
    setActionState((previous) => ({ ...previous, [key]: true }));

    try {
      if (action === 'edit') {
        window.location.assign(`/student/gigs/create?manageId=${encodeURIComponent(gig.id)}`);
        return;
      }

      if (action === 'duplicate') {
        const response = await API.post(`/gigs/${gig.id}/duplicate`);
        const duplicatedGig = response.data?.gig;

        if (duplicatedGig?.id) {
          setGigs((previous) => [
            duplicatedGig,
            ...previous
          ]);
        }
        return;
      }

      const response = await API.put(`/gigs/${gig.id}/lifecycle`, { action });
      const updatedGig = response.data?.gig;

      if (updatedGig?.id) {
        setGigs((previous) =>
          previous.map((item) =>
            item.id === updatedGig.id
              ? { ...item, status: updatedGig.status, updatedAt: updatedGig.updatedAt }
              : item
          )
        );
      }
    } catch (error) {
      setActionError(
        error?.response?.data?.error || 'Gig action failed. Please try again.'
      );
    } finally {
      setActionState((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <section className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <Link
                to="/student/portal"
                className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Workspace
              </Link>

              <div className="flex items-center gap-3 mt-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-cyan-400" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                    Student Workspace
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    My Gigs
                  </h1>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Track the current lifecycle state of your student services.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/custom-offers"
                className="px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-black flex items-center justify-center gap-2 hover:border-cyan-400/50 hover:text-white transition"
              >
                Custom Offers
              </Link>

              <Link
                to="/student/gigs/create"
                className="px-4 py-2.5 neon-airflow-btn text-white rounded-xl text-xs font-black flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Publish New Gig
              </Link>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="glass-panel rounded-3xl border border-slate-800 p-10 text-center">
          <p className="text-xs text-slate-500">Loading your gigs...</p>
        </section>
      ) : myGigs.length === 0 ? (
        <section className="glass-panel rounded-3xl border border-slate-800 p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-cyan-400" />
          </div>

          <h2 className="text-lg font-black text-white mt-4">
            You have not created a gig yet
          </h2>

          <p className="max-w-md mx-auto text-xs leading-6 text-slate-500 mt-2">
            Create your first service and track its lifecycle from draft to publication.
          </p>

          <Link
            to="/student/gigs/create"
            className="inline-flex mt-6 px-4 py-2.5 neon-airflow-btn text-white rounded-xl text-xs font-black items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Create Your First Gig
          </Link>
        </section>
      ) : (
        <section className="glass-panel rounded-3xl border border-slate-800 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                Gig Lifecycle
              </p>
              <h2 className="text-lg font-black text-white mt-1">
                {myGigs.length} gig{myGigs.length === 1 ? '' : 's'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {myGigs.map((gig) => {
              const firstPackage = gig.packages?.[0];
              const packageCount = gig.packages?.length || 0;
              const orderCount = gig.orders?.length || 0;
              const analytics = analyticsByGig[gig.id];
              const availability = gig.draftData?.delivery || {};
              const acceptingOrders =
                typeof availability.acceptingOrders === "boolean"
                  ? availability.acceptingOrders
                  : true;
              const unavailableUntil =
                typeof availability.unavailableUntil === "string"
                  ? availability.unavailableUntil.trim()
                  : "";
              const todayDateString = new Date().toISOString().split("T")[0];
              const effectiveAcceptingOrders =
                acceptingOrders ||
                (unavailableUntil && unavailableUntil <= todayDateString);

              const lifecycle = GIG_LIFECYCLE_META[gig.status] || {
                label: 'Unknown',
                description: 'Lifecycle status is unavailable.',
                className: 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              };

              return (
                <article
                  key={gig.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-cyan-500/30 transition"
                >
                  <div className="h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={gig.coverImage}
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                        {gig.category || 'Service'}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${lifecycle.className}`}
                        title={lifecycle.description}
                      >
                        {lifecycle.label}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white mt-2 line-clamp-2">
                      {gig.title}
                    </h3>

                    <p className="text-sm leading-6 text-slate-400 mt-2 line-clamp-3">
                      {stripHtmlForPreview(gig.description) || 'No service description added yet.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Starting price
                        </p>
                        <p className="text-xl font-black text-emerald-400 mt-1">
                          ₹{Number(firstPackage?.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Delivery
                        </p>
                        <p className="text-base font-black text-white mt-1">
                          {firstPackage?.deliveryDays ?? '-'} days
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
                            Order availability
                          </p>
                          <p className="mt-1 text-sm font-black text-white">
                            {effectiveAcceptingOrders ? 'Accepting new orders' : 'Not accepting new orders'}
                          </p>
                          {!effectiveAcceptingOrders && unavailableUntil && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Until {new Date(`${unavailableUntil}T00:00:00Z`).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={effectiveAcceptingOrders}
                          aria-label={
                            effectiveAcceptingOrders
                              ? 'Turn off new orders'
                              : 'Turn on new orders'
                          }
                          disabled={Boolean(actionState[`${gig.id}:availability`])}
                          onClick={() => toggleGigAvailability(gig)}
                          className={[
                            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            effectiveAcceptingOrders
                              ? 'border-emerald-400/40 bg-emerald-500/20'
                              : 'border-slate-700 bg-slate-900'
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                              effectiveAcceptingOrders
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            ].join(' ')}
                          />
                        </button>
                      </div>
                    </div>

                    {analytics && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                        <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Views</p>
                          <p className="text-sm font-black text-white mt-1">{analytics.views ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Clicks</p>
                          <p className="text-sm font-black text-white mt-1">{analytics.clicks ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Favorites</p>
                          <p className="text-sm font-black text-white mt-1">{analytics.favorites ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Orders</p>
                          <p className="text-sm font-black text-white mt-1">{analytics.orders ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Conversion</p>
                          <p className="text-sm font-black text-emerald-300 mt-1">{analytics.conversionRate ?? 0}%</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Revenue</p>
                          <p className="text-sm font-black text-emerald-300 mt-1">
                            ₹{Number(analytics.revenue || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Packages
                        </p>
                        <p className="text-sm font-black text-white mt-1">
                          {packageCount || 1}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/80 px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                          Orders
                        </p>
                        <p className="text-sm font-black text-white mt-1">
                          {orderCount}
                        </p>
                      </div>
                    </div>

                    {actionError && (
                      <p className="mt-3 text-xs leading-5 text-red-300">
                        {actionError}
                      </p>
                    )}

                    {['PUBLISHED', 'PAUSED'].includes(gig.status) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                        <Link
                          to={`/gigs/${gig.id}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-[10px] font-black text-cyan-300 hover:border-cyan-400/50 hover:text-white transition"
                        >
                          View Gig
                        </Link>

                        <button
                          type="button"
                          onClick={() => runGigAction(gig, 'edit')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-[10px] font-black text-slate-300 hover:border-cyan-500/40 hover:text-white transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(actionState[`${gig.id}:${gig.status === 'PAUSED' ? 'resume' : 'pause'}`])}
                          onClick={() =>
                            runGigAction(
                              gig,
                              gig.status === 'PAUSED' ? 'resume' : 'pause'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-[10px] font-black text-slate-300 hover:border-cyan-500/40 hover:text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {gig.status === 'PAUSED' ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              Pause
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(actionState[`${gig.id}:duplicate`])}
                          onClick={() => runGigAction(gig, 'duplicate')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-[10px] font-black text-slate-300 hover:border-cyan-500/40 hover:text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {actionState[`${gig.id}:duplicate`] ? 'Copying…' : 'Duplicate'}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(actionState[`${gig.id}:archive`])}
                          onClick={() => runGigAction(gig, 'archive')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-[10px] font-black text-slate-300 hover:border-red-500/40 hover:text-red-200 transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archive
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <Link
                          to={`/student/gigs/create?draftId=${encodeURIComponent(gig.id)}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-[10px] font-black text-cyan-300 hover:border-cyan-400/50 hover:text-white transition"
                        >
                          Open Draft
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 mt-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <PackageCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-xs text-slate-500 truncate">
                          {gig.status === 'PUBLISHED'
                            ? `Published ${new Date(gig.updatedAt || gig.createdAt).toLocaleDateString('en-IN')}`
                            : `Created ${new Date(gig.createdAt).toLocaleDateString('en-IN')}`}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-cyan-300">
                        {gig.subcategory || gig.category || 'Service'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
