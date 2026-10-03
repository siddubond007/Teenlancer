import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, FileText, UserRound } from 'lucide-react';
import API from '../services/api';

export default function ClientProjectDetailsPage() {
  const { projectId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/jobs/${projectId}`)
      .then(res => {
        setJob(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        Loading project...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">
          Project not found
        </h2>
      </div>
    );
  }

  const currentOrder = (job.orders || [])
    .filter((order) => order.status !== 'CANCELLED_REFUNDED')
    .find((order) => [
      'PENDING_PAYMENT',
      'FUNDED_IN_ESCROW',
      'REQUIREMENTS_SUBMITTED',
      'IN_PROGRESS',
      'DELIVERED',
      'REVISION_REQUESTED',
      'IN_REVIEW',
      'COMPLETED',
      'DISPUTED'
    ].includes(order.status)) || null;

  const hiredBid = (job.bids || []).find((bid) => bid.status === 'HIRED');
  const projectStatus = String(job.status || '').toUpperCase();

  const statusMeta = currentOrder?.status === 'PENDING_PAYMENT'
    ? {
        label: 'Payment Pending',
        tone: 'amber',
        message: 'Complete payment to secure the project.'
      }
    : ['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'IN_REVIEW'].includes(currentOrder?.status)
      ? {
          label: 'Hired · In Progress',
          tone: 'cyan',
          message: 'The project is active and work is underway.'
        }
      : currentOrder?.status === 'COMPLETED'
        ? {
            label: 'Completed',
            tone: 'emerald',
            message: 'This project has been completed.'
          }
        : currentOrder?.status === 'DISPUTED'
          ? {
              label: 'Disputed',
              tone: 'red',
              message: 'This project currently has a dispute.'
            }
          : projectStatus === 'DRAFT'
            ? {
                label: 'Draft',
                tone: 'slate',
                message: 'Finish the project brief before publishing.'
              }
            : {
                label: 'Published · Hiring',
                tone: 'indigo',
                message: job.bids?.length
                  ? `${job.bids.length} proposal${job.bids.length === 1 ? '' : 's'} received.`
                  : 'Waiting for student proposals.'
              };

  const statusClasses = {
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-300 border-red-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  const deadlineValue = currentOrder?.deadline || job.deadlineDate;
  const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;
  const now = new Date();

  const daysRemaining = deadlineDate && !Number.isNaN(deadlineDate.getTime())
    ? Math.round(
        (
          Date.UTC(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()) -
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
        ) / 86400000
      )
    : null;

  const deadlineLabel = daysRemaining === null
    ? (job.timeline || 'Not specified').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : daysRemaining < 0
      ? 'Overdue'
      : daysRemaining === 0
        ? 'Due today'
        : daysRemaining === 1
          ? 'Due tomorrow'
          : `${daysRemaining} days left`;

  const deadlineTone = daysRemaining !== null && daysRemaining < 0
    ? 'text-red-300'
    : daysRemaining !== null && daysRemaining <= 3
      ? 'text-amber-300'
      : 'text-slate-200';

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">

          <div className="min-w-0 flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1.5 rounded-xl border text-sm font-black ${statusClasses[statusMeta.tone]}`}>
                {statusMeta.label}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-slate-300">
                {job.category}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white break-words">
              {job.title}
            </h1>

            <p className="text-sm md:text-base text-slate-400 mt-2">
              {statusMeta.message}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3">
                <p className="text-xs font-bold text-slate-500">Budget</p>
                <p className="text-base font-black text-white mt-1">
                  ₹{Number(job.budget || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3">
                <p className="text-xs font-bold text-slate-500">Deadline</p>
                <p className={`text-sm font-black mt-1 ${deadlineTone}`}>
                  {deadlineLabel}
                </p>
                {deadlineDate && !Number.isNaN(deadlineDate.getTime()) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {deadlineDate.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 col-span-2 sm:col-span-1">
                <p className="text-xs font-bold text-slate-500">Proposals</p>
                <p className="text-base font-black text-white mt-1">
                  {job.bids?.length || 0}
                </p>
              </div>
            </div>

            {currentOrder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <UserRound className="w-3.5 h-3.5" />
                    Selected Student
                  </p>
                  <p className="text-sm font-black text-white mt-1">
                    {currentOrder.seller?.fullName || hiredBid?.student?.fullName || 'Student'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    {currentOrder.status === 'PENDING_PAYMENT'
                      ? <CreditCard className="w-3.5 h-3.5" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Order State
                  </p>
                  <p className="text-sm font-black text-white mt-1">
                    {currentOrder.status === 'PENDING_PAYMENT'
                      ? 'Payment required'
                      : currentOrder.status.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap w-full lg:w-auto lg:max-w-xs lg:shrink-0">
            {projectStatus === 'DRAFT' ? (
              <Link
                to={`/post-job?draftId=${job.id}`}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-black inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
                Continue Editing
              </Link>
            ) : currentOrder?.status === 'PENDING_PAYMENT' ? (
              <Link
                to={`/my-projects/${job.id}/proposals`}
                className="w-full lg:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-black"
              >
                Complete Payment
              </Link>
            ) : currentOrder ? (
              <Link
                to={`/orders/${currentOrder.id}`}
                className="w-full lg:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-black inline-flex items-center justify-center gap-2"
              >
                <Clock3 className="w-4 h-4" />
                Open Order Workspace
              </Link>
            ) : (
              <>
                <Link
                  to={`/my-projects/${job.id}/proposals`}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-black"
                >
                  View Proposals
                </Link>

                <Link
                  to={`/post-job?draftId=${job.id}`}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white text-sm font-black"
                >
                  Edit Job
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Next Step
            </p>
            <h2 className="text-xl font-black text-white mt-1">
              {currentOrder?.status === 'PENDING_PAYMENT'
                ? 'Complete payment to secure this project'
                : currentOrder
                  ? currentOrder.status === 'DELIVERED'
                    ? 'Review the delivered work'
                    : currentOrder.status === 'REVISION_REQUESTED'
                      ? 'Review the revised delivery'
                      : currentOrder.status === 'COMPLETED'
                        ? 'Project complete'
                        : currentOrder.status === 'DISPUTED'
                          ? 'Review the dispute'
                          : 'Continue in the Order Workspace'
                  : job.bids?.length
                    ? 'Review student proposals'
                    : 'Waiting for student proposals'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {currentOrder?.status === 'PENDING_PAYMENT'
                ? 'Return to Proposals to continue the existing hiring payment flow.'
                : currentOrder
                  ? 'Your project work, delivery, review, and communication are managed in the Order Workspace.'
                  : job.bids?.length
                    ? 'Compare proposals, shortlist candidates, or start the hiring process.'
                    : 'Student freelancers can submit proposals while this project is open.'}
            </p>
          </div>

          <div className="shrink-0">
            {currentOrder?.status === 'PENDING_PAYMENT' ? (
              <Link
                to={`/my-projects/${job.id}/proposals`}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-black inline-flex items-center justify-center"
              >
                Complete Payment
              </Link>
            ) : currentOrder ? (
              <Link
                to={`/orders/${currentOrder.id}`}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-black inline-flex items-center justify-center"
              >
                Open Order Workspace
              </Link>
            ) : (
              <Link
                to={`/my-projects/${job.id}/proposals`}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-black inline-flex items-center justify-center"
              >
                {job.bids?.length ? 'Review Proposals' : 'View Proposals'}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Overview
        </h2>

        <p className="text-slate-300 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {job.description || 'No description provided'}
        </p>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Deliverables
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              What the freelancer is expected to provide.
            </p>
          </div>

          {Array.isArray(job.deliverables) && job.deliverables.length > 0 && (
            <span className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-black text-indigo-300">
              {job.deliverables.length} item{job.deliverables.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {Array.isArray(job.deliverables) && job.deliverables.length > 0 ? (
          <div className="space-y-2">
            {job.deliverables.map((item, i) => (
              <div
                key={`${item}-${i}`}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800"
              >
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-black shrink-0">
                  {i + 1}
                </span>
                <p className="text-base text-slate-200 leading-6 [overflow-wrap:anywhere]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-sm text-slate-500">
            No deliverables specified.
          </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">
            Requirements
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Constraints, expectations, or information needed to complete the project.
          </p>
        </div>

        {job.requirements ? (
          <div className="p-4 md:p-5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-base leading-7 text-slate-300 whitespace-pre-wrap [overflow-wrap:anywhere]">
              {job.requirements}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-sm text-slate-500">
            No requirements provided.
          </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Skills & Experience
        </h2>

        <div className="mb-4 text-slate-300">
          Experience Level: {job.experienceLevel || 'Not specified'}
        </div>

        <div className="flex flex-wrap gap-2">
          {(job.skills || []).map(skill => (
            <span
              key={skill}
              className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">
            Budget & Timeline
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Commercial terms and project timing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500">Budget Type</p>
            <p className="text-base font-black text-white mt-1">
              {job.budgetType || 'Not specified'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500">
              {currentOrder ? 'Agreed Amount' : 'Project Budget'}
            </p>
            <p className="text-base font-black text-white mt-1">
              ₹{Number(currentOrder?.totalAmount ?? job.budget ?? 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500">Currency</p>
            <p className="text-base font-black text-white mt-1">
              {job.currency || 'INR'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500">Start Preference</p>
            <p className="text-base font-black text-white mt-1">
              {(job.startPreference || 'Not specified')
                .toLowerCase()
                .replaceAll('_', ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500">Start Date</p>
            <p className="text-base font-black text-white mt-1">
              {job.startDate
                ? new Date(job.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Not specified'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500">Deadline</p>
            <p className={`text-base font-black mt-1 ${deadlineTone}`}>
              {deadlineLabel}
            </p>
            {deadlineDate && !Number.isNaN(deadlineDate.getTime()) ? (
              <p className="text-xs text-slate-500 mt-1">
                {deadlineDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                {job.timeline
                  ? job.timeline
                      .toLowerCase()
                      .replaceAll('_', ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                  : 'Not specified'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">
            Attachments & References
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Files, shared resources, and reference websites for this project.
          </p>
        </div>

        {(job.attachmentUrls?.length > 0 ||
          job.externalLinks?.length > 0 ||
          job.referenceLinks?.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {job.attachmentUrls?.map((url, i) => {
              const fileName = (() => {
                try {
                  return decodeURIComponent(
                    url.split('/').pop().split('?')[0] || `Attachment ${i + 1}`
                  );
                } catch {
                  return url.split('/').pop().split('?')[0] || `Attachment ${i + 1}`;
                }
              })();

              return (
                <a
                  key={`attachment-${i}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/30 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-200 break-words">
                      {fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Uploaded attachment · View / download
                    </p>
                  </div>
                </a>
              );
            })}

            {job.externalLinks?.map((url, i) => (
              <a
                key={`external-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-blue-500/30 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-200 break-all">
                    {url}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cloud Drive Link
                  </p>
                </div>
              </a>
            ))}

            {job.referenceLinks?.map((url, i) => (
              <a
                key={`reference-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-violet-500/30 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <ArrowLeft className="w-5 h-5 text-violet-300 rotate-180 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-200 break-all">
                    {url}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Reference Website
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-sm text-slate-500">
            No attachments, shared links, or reference websites provided.
          </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              Proposals
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hiring activity for this project.
            </p>
          </div>

          <Link
            to={`/my-projects/${job.id}/proposals`}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-black text-center"
          >
            {currentOrder ? 'View Proposal History' : 'Review Proposals'}
          </Link>
        </div>

        {(() => {
          const bids = job.bids || [];
          const pendingCount = bids.filter((bid) => bid.status === 'PENDING').length;
          const shortlistedCount = bids.filter((bid) => bid.status === 'SHORTLISTED').length;
          const rejectedCount = bids.filter((bid) => bid.status === 'REJECTED').length;
          const hiredCount = bids.filter((bid) => bid.status === 'HIRED').length;

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-500">Total</p>
                  <p className="text-xl font-black text-white mt-1">
                    {bids.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-500">Pending</p>
                  <p className="text-xl font-black text-slate-200 mt-1">
                    {pendingCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-500">Shortlisted</p>
                  <p className="text-xl font-black text-amber-300 mt-1">
                    {shortlistedCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-500">
                    {hiredCount > 0 ? 'Hired' : 'Rejected'}
                  </p>
                  <p className={`text-xl font-black mt-1 ${
                    hiredCount > 0 ? 'text-emerald-300' : 'text-slate-300'
                  }`}>
                    {hiredCount > 0 ? hiredCount : rejectedCount}
                  </p>
                </div>
              </div>

              {currentOrder && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm font-black text-emerald-300">
                    {currentOrder.seller?.fullName || 'Selected student'} is attached to this order.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Open the Order Workspace for the active project workflow.
                  </p>
                </div>
              )}

              {!bids.length && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-sm text-slate-500">
                  No proposals have been submitted yet.
                </div>
              )}
            </>
          );
        })()}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">
            Activity
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            A timeline of the latest project and order activity.
          </p>
        </div>

        {currentOrder?.activityEvents?.length > 0 ? (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-800" />

            {currentOrder.activityEvents.map((event, index) => (
              <div key={event.id} className="relative">
                <span
                  className={`absolute -left-[1.15rem] top-1.5 w-3 h-3 rounded-full border-2 ${
                    index === currentOrder.activityEvents.length - 1
                      ? 'bg-indigo-400 border-indigo-300'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                />

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white break-words">
                        {event.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {event.actor?.fullName
                          ? `By ${event.actor.fullName}`
                          : 'System activity'}
                        {event.source ? ` · ${event.source.replaceAll('_', ' ')}` : ''}
                      </p>
                    </div>

                    <time className="text-xs text-slate-500 shrink-0">
                      {new Date(event.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800">
              <p className="text-sm font-bold text-slate-200">
                Project created
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(job.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {job.status !== 'DRAFT' && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800">
                <p className="text-sm font-bold text-slate-200">
                  Project published
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  This project is available in the marketplace workflow.
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800">
              <p className="text-sm font-bold text-slate-200">
                Last updated
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(job.updatedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
