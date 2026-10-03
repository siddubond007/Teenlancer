import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Clock3, Wallet, AlertTriangle, FileText, Star, ShieldCheck } from 'lucide-react';
import API from '../services/api';

const NOTIFICATION_META = {
  DELIVERABLE_SUBMITTED: {
    label: 'Delivery',
    icon: FileText,
    tone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'
  },
  REVISION_REQUESTED: {
    label: 'Revision',
    icon: AlertTriangle,
    tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20'
  },
  ORDER_APPROVED: {
    label: 'Payment',
    icon: Wallet,
    tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
  },
  ORDER_AUTO_APPROVED: {
    label: 'Payment',
    icon: Clock3,
    tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
  },
  REVIEW_RECEIVED: {
    label: 'Review',
    icon: Star,
    tone: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
  }
};

const getNotificationMeta = (type) =>
  NOTIFICATION_META[type] || {
    label: 'Update',
    icon: ShieldCheck,
    tone: 'text-slate-300 bg-slate-500/10 border-slate-500/20'
  };

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');

      setNotifications(
        Array.isArray(res.data)
          ? res.data
          : (res.data.notifications || [])
      );

      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-black text-white">Notifications</h1>
        </div>

        <button
          onClick={markAllRead}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
        >
          Mark All Read
        </button>
      </div>


      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-xs text-slate-400 uppercase font-bold">Total</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl text-center border border-indigo-500/30">
          <div className="text-2xl font-black text-indigo-400">{stats.unread}</div>
          <div className="text-xs text-slate-400 uppercase font-bold">Unread</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl text-center border border-emerald-500/30">
          <div className="text-2xl font-black text-emerald-400">{stats.read}</div>
          <div className="text-xs text-slate-400 uppercase font-bold">Read</div>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl text-slate-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => {
            const meta = getNotificationMeta(n.type);
            const Icon = meta.icon;

            return (
              <div
                key={n.id}
                className={`glass-panel p-5 rounded-2xl border transition ${
                  n.isRead
                    ? 'border-slate-800'
                    : 'border-indigo-500/40 shadow-[0_0_24px_rgba(99,102,241,0.06)]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${meta.tone}`}>
                        {meta.label}
                      </span>

                      {!n.isRead && (
                        <span className="px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                          New
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white mt-2">
                      {n.title}
                    </h3>

                    <p className="text-sm leading-6 text-slate-400 mt-1">
                      {n.message}
                    </p>

                    <p className="text-xs text-slate-600 mt-2">
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </p>

                    {n.orderId && (
                      <Link
                        to={`/orders/${n.orderId}`}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                        }}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-black text-indigo-300 hover:text-indigo-200 transition"
                      >
                        Open Project Room →
                      </Link>
                    )}
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="shrink-0 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-black flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
