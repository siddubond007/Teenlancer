import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PackageCheck, Search, Star } from 'lucide-react';
import API from '../services/api';

const FILTERS = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'REVISION_REQUESTED', label: 'Revision' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'CANCELLED_REFUNDED', label: 'Cancelled' }
];

const ACTIVE_STATUSES = [
  'FUNDED_IN_ESCROW',
  'REQUIREMENTS_SUBMITTED',
  'IN_PROGRESS',
  'DELIVERED',
  'REVISION_REQUESTED'
];

export default function StudentOrdersPage({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    API.get('/orders')
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.id?.toLowerCase().includes(query) ||
        order.client?.fullName?.toLowerCase().includes(query) ||
        order.seller?.fullName?.toLowerCase().includes(query) ||
        order.status?.toLowerCase().includes(query);

      let matchesFilter = true;

      if (filter === 'ACTIVE') {
        matchesFilter = ACTIVE_STATUSES.includes(order.status);
      } else if (filter !== 'ALL') {
        matchesFilter = order.status === filter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const getStatusLabel = (status) => {
    const labels = {
      FUNDED_IN_ESCROW: 'Funded in Escrow',
      REQUIREMENTS_SUBMITTED: 'Requirements Submitted',
      IN_PROGRESS: 'In Progress',
      DELIVERED: 'Delivered',
      REVISION_REQUESTED: 'Revision Requested',
      COMPLETED: 'Completed',
      DISPUTED: 'Disputed',
      CANCELLED_REFUNDED: 'Cancelled'
    };

    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    if (status === 'COMPLETED') {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }

    if (status === 'DISPUTED') {
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    }

    if (status === 'CANCELLED_REFUNDED') {
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }

    if (status === 'DELIVERED' || status === 'REVISION_REQUESTED') {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  };

  return (
    <div className="space-y-6 pb-16">
      <section className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
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
                  <PackageCheck className="w-6 h-6 text-indigo-400" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                    Student Workspace
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    My Orders
                  </h1>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Track every client project assigned to your account.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase text-slate-500">Total</p>
                <p className="text-xl font-black text-white mt-1">{orders.length}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase text-slate-500">Active</p>
                <p className="text-xl font-black text-indigo-400 mt-1">
                  {orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                <p className="text-[9px] font-black uppercase text-slate-500">Completed</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {orders.filter((o) => o.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, clients, or status..."
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`shrink-0 px-3 py-2.5 rounded-xl text-[11px] font-black transition ${
                  filter === item.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="glass-panel rounded-3xl border border-slate-800 p-10 text-center">
          <p className="text-xs text-slate-500">Loading your orders...</p>
        </section>
      ) : filteredOrders.length === 0 ? (
        <section className="glass-panel rounded-3xl border border-slate-800 p-10 text-center">
          <PackageCheck className="w-8 h-8 text-slate-600 mx-auto" />
          <h2 className="text-lg font-black text-white mt-4">
            No matching orders
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Try another search term or status filter.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {filteredOrders.map((order) => {
            const otherUser =
              order.sellerId === currentUser?.id
                ? order.client?.fullName
                : order.seller?.fullName;

            const reviewed = (order.reviews || []).some(
              (review) => review.reviewerId === currentUser?.id
            );

            const latestDeliverable = Array.isArray(order.deliverables)
              ? [...order.deliverables].sort(
                  (a, b) => Number(b.version || 0) - Number(a.version || 0)
                )[0]
              : null;

            return (
              <article
                key={order.id}
                className="glass-panel rounded-2xl border border-slate-800 p-5 hover:border-indigo-500/30 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                        Order #{order.id.slice(0, 8)}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${getStatusClass(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <h2 className="text-base font-black text-white mt-2">
                      {order.client?.id === currentUser?.id ? 'Freelancer' : 'Client'}: {otherUser || 'User'}
                    </h2>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Created {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>

                    {latestDeliverable && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-300">
                          Delivery v{latestDeliverable.version || 1}
                        </span>

                        <span className="text-[10px] text-slate-500">
                          {latestDeliverable.reviewStatus === 'REVISION_REQUESTED'
                            ? 'Changes requested'
                            : latestDeliverable.reviewStatus === 'APPROVED'
                              ? 'Approved'
                              : latestDeliverable.reviewStatus === 'PENDING_REVIEW'
                                ? 'Awaiting review'
                                : 'Delivery submitted'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="sm:text-right">
                      <p className="text-[9px] font-black uppercase text-slate-600">
                        Order Value
                      </p>
                      <p className="text-xl font-black text-emerald-400">
                        ₹{order.totalAmount}
                      </p>
                    </div>

                    {order.status === 'COMPLETED' && !reviewed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400">
                        <Star className="w-3.5 h-3.5" />
                        Review available
                      </span>
                    )}

                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-2.5 rounded-xl neon-airflow-btn text-white text-[11px] font-black text-center"
                    >
                      Open Project Room
                    </Link>
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
