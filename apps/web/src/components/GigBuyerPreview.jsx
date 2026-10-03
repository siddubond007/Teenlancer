import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Image as ImageIcon,
  Tag,
  UserRound,
  X
} from 'lucide-react';
import { sanitizeRichTextHtml } from '../utils/richText.js';

const TYPE_LABELS = {
  text: 'Text response',
  'long-text': 'Detailed response',
  'multiple-choice': 'Choose one option',
  checkbox: 'Confirmation',
  'file-upload': 'File upload'
};

const meaningfulItems = (items) =>
  Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

const meaningfulRequirement = (requirement) =>
  String(requirement?.question || '').trim().length > 0;

const meaningfulFaq = (faq) =>
  String(faq?.question || '').trim().length > 0 &&
  String(faq?.answer || '').trim().length > 0;

function PreviewSection({ eyebrow, title, children }) {
  return (
    <section
      aria-labelledby={`preview-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      className="rounded-3xl border border-slate-800 bg-slate-950/45 p-5 sm:p-7"
    >
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
          {eyebrow}
        </p>
        <h2
          id={`preview-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="mt-2 text-xl font-black text-white sm:text-2xl"
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function GigBuyerPreview({
  basics,
  description,
  pricing,
  delivery,
  packages = [],
  extras = [],
  requirements,
  media,
  faqs,
  categorySpecificFields = [],
  discovery = {},
  categoryName,
  subcategoryName,
  serviceTypeName,
  sellerName,
  sellerProfile
}) {
  const safeBasics = basics || {};
  const safePricing = pricing || {};
  const safeDelivery = delivery || {};
  const safePackages = Array.isArray(packages)
    ? packages.filter((pkg) => pkg && typeof pkg === 'object')
    : [];
  const safeExtras = Array.isArray(extras)
    ? extras.filter((extra) => extra && typeof extra === 'object')
    : [];
  const isMultiPackage =
    safePricing.packageModel === 'multi' && safePackages.length > 0;
  const safeMedia = media || {};
  const profile = sellerProfile?.profile || {};
  const sellerRating = Number(sellerProfile?.averageRating || 0);
  const sellerReviewCount = Number(sellerProfile?.totalReviews || 0);
  const sellerVerified = sellerProfile?.verification?.status === 'APPROVED';
  const responseTimeExpectation = String(
    sellerProfile?.profile?.responseTimeExpectation || ''
  ).trim();
  const profileSkills = Array.isArray(profile.skills)
    ? profile.skills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];
  const profilePortfolio = Array.isArray(profile.portfolioItems)
    ? profile.portfolioItems.filter((item) => item && typeof item === 'object')
    : [];

  const discoveryKeywords = meaningfulItems(discovery.keywords);
  const discoveryLanguages = meaningfulItems(discovery.languages);
  const discoveryAudiences = meaningfulItems(discovery.targetAudience);

  const includedItems = meaningfulItems(safeDelivery.includedItems);
  const excludedItems = meaningfulItems(safeDelivery.excludedItems);
  const deliverables = meaningfulItems(safeDelivery.deliverables);

  const validGallery = Array.isArray(safeMedia.gallery)
    ? safeMedia.gallery.filter(
        (item) =>
          item &&
          item.previewUrl &&
          !item.validationError
      )
    : [];

  const validCover =
    safeMedia.cover?.previewUrl && !safeMedia.cover?.validationError
      ? safeMedia.cover
      : null;

  const portfolioLinks = Array.isArray(safeMedia.portfolioLinks)
    ? safeMedia.portfolioLinks
        .map((link) => String(link || '').trim())
        .filter(Boolean)
    : [];

  const liveDemoUrl = String(safeMedia.liveDemoUrl || '').trim();
  const hasValidLiveDemo =
    liveDemoUrl.length > 0 &&
    (() => {
      try {
        const parsed = new URL(liveDemoUrl);
        return /^(https?:)$/i.test(parsed.protocol) && Boolean(parsed.hostname);
      } catch {
        return false;
      }
    })();

  const validVideo =
    safeMedia.video?.previewUrl && !safeMedia.video?.validationError
      ? safeMedia.video
      : null;

  const validRequirements = Array.isArray(requirements)
    ? requirements.filter(meaningfulRequirement)
    : [];

  const validFaqs = Array.isArray(faqs)
    ? faqs.filter(meaningfulFaq)
    : [];

  const sanitizedDescription = sanitizeRichTextHtml(description || '');

  const visibleCategorySpecificFields = categorySpecificFields.filter((field) => {
    if (field.type === 'multi-select') {
      return Array.isArray(field.value) && field.value.length > 0;
    }

    if (field.type === 'checkbox') {
      return Boolean(field.value);
    }

    return String(field.value ?? '').trim().length > 0;
  });


  const basePrice = Number(safePricing.basePrice);
  const hasPrice =
    safePricing.basePrice !== '' &&
    Number.isFinite(basePrice) &&
    basePrice > 0;

  const revisionsLabel =
    safeDelivery.revisions === 'unlimited'
      ? 'Unlimited revisions'
      : safeDelivery.revisions !== '' && safeDelivery.revisions !== undefined
        ? `${safeDelivery.revisions} revision${Number(safeDelivery.revisions) === 1 ? '' : 's'}`
        : 'Revision allowance not set';

  const acceptingOrders =
    typeof safeDelivery.acceptingOrders === 'boolean'
      ? safeDelivery.acceptingOrders
      : true;
  const unavailableUntil = String(safeDelivery.unavailableUntil || '').trim();
  const todayDateString = new Date().toISOString().split('T')[0];
  const effectiveAcceptingOrders =
    acceptingOrders ||
    (unavailableUntil && unavailableUntil <= todayDateString);

  const unavailableUntilLabel = unavailableUntil
    ? (() => {
        const parsed = new Date(`${unavailableUntil}T00:00:00Z`);
        return Number.isNaN(parsed.getTime())
          ? unavailableUntil
          : parsed.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC'
            });
      })()
    : '';

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold leading-5 text-cyan-100/80">
          This is a buyer-facing preview of your current draft. It shows the service
          using the information available so far.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/55">
        <div className="aspect-[16/8.5] w-full bg-slate-900">
          {validCover ? (
            <img
              src={validCover.previewUrl}
              alt={safeBasics.title?.trim() || 'Gig cover'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center px-6 text-center"
              aria-label="No gig cover available"
            >
              <ImageIcon className="h-8 w-8 text-slate-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-black text-slate-400">
                Cover image not added yet
              </p>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">
                Buyers will see your selected cover here once one is available.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {categoryName ? (
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-black text-cyan-300">
                {categoryName}
              </span>
            ) : null}

            {subcategoryName ? (
              <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-400">
                {subcategoryName}
              </span>
            ) : null}

            {serviceTypeName ? (
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-black text-indigo-300">
                {serviceTypeName}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
            {safeBasics.title?.trim() || 'Your service title will appear here'}
          </h1>

          {sellerName ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
              <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>
                By <span className="font-bold text-slate-200">{sellerName}</span>
              </span>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              Student creator
            </p>
          )}

          {(sellerProfile || profileSkills.length > 0) ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {sellerVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified student
                  </span>
                )}
                {sellerRating > 0 && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-300">
                    ★ {sellerRating.toFixed(1)}{sellerReviewCount > 0 ? ` · ${sellerReviewCount} reviews` : ''}
                  </span>
                )}
                {profile.college && (
                  <span className="rounded-full border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                    {profile.college}
                  </span>
                )}
                {responseTimeExpectation && (
                  <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-300">
                    Response: {responseTimeExpectation}
                  </span>
                )}
              </div>

              {profileSkills.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Profile skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profileSkills.slice(0, 10).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-[10px] font-bold text-indigo-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profilePortfolio.length > 0 && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    From your profile portfolio
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {profilePortfolio.slice(0, 4).map((item, index) => (
                      <div
                        key={item.id || `${item.title || 'portfolio'}-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2"
                      >
                        <p className="truncate text-xs font-bold text-slate-200">
                          {String(item.title || 'Portfolio item')}
                        </p>
                        {item.category && (
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            {String(item.category)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Starting price
              </p>
              <p className="mt-2 text-xl font-black text-emerald-300">
                {hasPrice
                  ? `${safePricing.currency || 'INR'} ${basePrice.toLocaleString('en-IN')}`
                  : 'Price not set'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Delivery
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-base font-black text-white">
                <Clock3 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                {safeDelivery.deliveryDays
                  ? `${safeDelivery.deliveryDays} day${Number(safeDelivery.deliveryDays) === 1 ? '' : 's'}`
                  : 'Not set'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Revisions
              </p>
              <p className="mt-2 text-base font-black text-white">
                {revisionsLabel}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Availability
            </p>

            {effectiveAcceptingOrders ? (
              <p className="mt-2 text-sm font-black text-emerald-300">
                Accepting new orders
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm font-black text-amber-300">
                  Not currently accepting new orders
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
              </>
            )}
          </div>
        </div>
      </div>

      {isMultiPackage ? (
        <PreviewSection eyebrow="Packages" title="Choose the package that fits">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {['Basic', 'Standard', 'Premium'].map((tierName) => {
              const pkg = safePackages.find((item) => item.tierName === tierName);
              if (!pkg) return null;

              const pkgIncluded = meaningfulItems(pkg.includedItems);
              const pkgExcluded = meaningfulItems(pkg.excludedItems);
              const pkgDeliverables = meaningfulItems(pkg.deliverables);
              const pkgFeatures = meaningfulItems(pkg.features);
              const pkgPrice = Number(pkg.price);
              const pkgRevisions =
                pkg.revisions === 'unlimited'
                  ? 'Unlimited revisions'
                  : pkg.revisions !== '' && pkg.revisions !== undefined
                    ? `${pkg.revisions} revision${Number(pkg.revisions) === 1 ? '' : 's'}`
                    : 'Revision allowance not set';

              return (
                <article
                  key={tierName}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-white">{tierName}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {pkg.description || 'Package details'}
                      </p>
                    </div>

                    <p className="shrink-0 text-xl font-black text-emerald-300">
                      {Number.isFinite(pkgPrice) && pkgPrice > 0
                        ? `${safePricing.currency || 'INR'} ${pkgPrice.toLocaleString('en-IN')}`
                        : 'Price not set'}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                        Delivery
                      </p>
                      <p className="mt-1 text-xs font-bold text-white">
                        {pkg.deliveryDays
                          ? `${pkg.deliveryDays} day${Number(pkg.deliveryDays) === 1 ? '' : 's'}`
                          : 'Not set'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                        Revisions
                      </p>
                      <p className="mt-1 text-xs font-bold text-white">{pkgRevisions}</p>
                    </div>
                  </div>

                  {pkgFeatures.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Features
                      </p>
                      <ul className="mt-3 space-y-2">
                        {pkgFeatures.map((item, index) => (
                          <li
                            key={`${tierName}-feature-${index}`}
                            className="flex items-start gap-2 text-xs leading-5 text-slate-300"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {pkgIncluded.length > 0 ? (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Included
                      </p>
                      <ul className="mt-2 space-y-2">
                        {pkgIncluded.map((item, index) => (
                          <li
                            key={`${tierName}-included-${index}`}
                            className="flex items-start gap-2 text-xs leading-5 text-slate-300"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {pkgExcluded.length > 0 ? (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Not included
                      </p>
                      <ul className="mt-2 space-y-2">
                        {pkgExcluded.map((item, index) => (
                          <li
                            key={`${tierName}-excluded-${index}`}
                            className="flex items-start gap-2 text-xs leading-5 text-slate-400"
                          >
                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {pkgDeliverables.length > 0 ? (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Deliverables
                      </p>
                      <ul className="mt-2 space-y-2">
                        {pkgDeliverables.map((item, index) => (
                          <li
                            key={`${tierName}-deliverable-${index}`}
                            className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs leading-5 text-slate-300"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </PreviewSection>
      ) : null}

      {safeExtras.length > 0 ? (
        <PreviewSection eyebrow="Optional extras" title="Add more to the service">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {safeExtras.map((extra, index) => {
              const extraPrice = Number(extra.price);
              const extraTitle = String(extra.title || '').trim();
              const extraScope =
                extra.scope && typeof extra.scope === 'object'
                  ? String(extra.scope.description || '').trim()
                  : '';

              return (
                <article
                  key={extra.id || `extra-${index}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-black text-white">
                        {extraTitle || 'Optional extra'}
                      </p>
                      {extraScope ? (
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {extraScope}
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 text-lg font-black text-amber-300">
                      {Number.isFinite(extraPrice) && extraPrice > 0
                        ? `+${safePricing.currency || 'INR'} ${extraPrice.toLocaleString('en-IN')}`
                        : 'Price not set'}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </PreviewSection>
      ) : null}

      {visibleCategorySpecificFields.length > 0 ? (
        <PreviewSection eyebrow="Service details" title="Service-specific details">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleCategorySpecificFields.map((field) => {
              const displayValue =
                field.type === 'checkbox'
                  ? field.value
                    ? 'Yes'
                    : 'No'
                  : field.type === 'multi-select'
                    ? (field.options || [])
                        .filter((option) => field.value.includes(option.value))
                        .map((option) => option.label)
                        .join(', ')
                    : (field.options || []).find(
                        (option) => option.value === field.value
                      )?.label || String(field.value);

              return (
                <div
                  key={field.key}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
                >
                  <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    {field.label}
                  </dt>
                  <dd className="mt-2 break-words text-sm font-bold leading-6 text-white">
                    {displayValue}
                  </dd>
                </div>
              );
            })}
          </dl>
        </PreviewSection>
      ) : null}

      {(discoveryKeywords.length > 0 ||
        discoveryLanguages.length > 0 ||
        discoveryAudiences.length > 0) ? (
        <PreviewSection eyebrow="Discovery" title="Findability signals">
          <div className="space-y-5">
            {discoveryKeywords.length > 0 ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Keywords
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {discoveryKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {discoveryLanguages.length > 0 ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Languages
                </p>
                <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-200">
                  {discoveryLanguages.join(', ')}
                </p>
              </div>
            ) : null}

            {discoveryAudiences.length > 0 ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Target audience
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {discoveryAudiences.map((audience) => (
                    <span
                      key={audience}
                      className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-200"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </PreviewSection>
      ) : null}

      <PreviewSection eyebrow="About the service" title="What you’re getting">
        {sanitizedDescription ? (
          <div
            className="max-w-none break-words text-sm leading-7 text-slate-300 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-black [&_strong]:text-white [&_b]:font-black [&_b]:text-white [&_em]:italic [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:pl-1"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            No service description has been added yet.
          </p>
        )}

        {Array.isArray(safeBasics.skills) && safeBasics.skills.length > 0 ? (
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-300" aria-hidden="true" />
              <h3 className="text-sm font-black text-white">Skills & expertise</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {safeBasics.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </PreviewSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PreviewSection eyebrow="Scope" title="What’s included">
          {includedItems.length > 0 ? (
            <ul className="space-y-3">
              {includedItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Included items have not been added yet.</p>
          )}

          {excludedItems.length > 0 ? (
            <div className="mt-6 border-t border-slate-800 pt-5">
              <h3 className="text-sm font-black text-white">What’s not included</h3>
              <ul className="mt-3 space-y-3">
                {excludedItems.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-slate-400">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-300">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </PreviewSection>

        <PreviewSection eyebrow="Deliverables" title="What you’ll receive">
          {deliverables.length > 0 ? (
            <ul className="space-y-3">
              {deliverables.map((item, index) => (
                <li key={`${item}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/55 px-4 py-3 text-sm font-semibold leading-6 text-slate-300">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No deliverables have been added yet.</p>
          )}
        </PreviewSection>
      </div>

      <PreviewSection eyebrow="Buyer inputs" title="What I’ll need from you">
        {validRequirements.length > 0 ? (
          <div className="space-y-4">
            {validRequirements.map((requirement, index) => {
              const options = meaningfulItems(requirement.options);

              return (
                <article
                  key={requirement.id || `${requirement.question}-${index}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-xs font-black text-cyan-300"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black leading-6 text-white">
                          {String(requirement.question).trim()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {TYPE_LABELS[requirement.type] || 'Buyer response'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={[
                        'shrink-0 self-start rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
                        requirement.required
                          ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-700 bg-slate-950 text-slate-400'
                      ].join(' ')}
                    >
                      {requirement.required ? 'Required' : 'Optional'}
                    </span>
                  </div>

                  {requirement.type === 'multiple-choice' && options.length >= 2 ? (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                        Choices
                      </p>
                      <ul className="mt-2 space-y-2">
                        {options.map((option, optionIndex) => (
                          <li
                            key={`${option}-${optionIndex}`}
                            className="text-sm text-slate-300"
                          >
                            <span className="mr-2 text-slate-600">{optionIndex + 1}.</span>
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            No buyer requirements have been added yet.
          </p>
        )}
      </PreviewSection>

      {validGallery.length > 0 ? (
        <PreviewSection eyebrow="More work" title="Gallery">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {validGallery.map((item, index) => (
              <figure key={item.id || `${item.previewUrl}-${index}`} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="aspect-[4/3] w-full">
                  <img
                    src={item.previewUrl}
                    alt={`Gig gallery image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </figure>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {validVideo ? (
        <PreviewSection eyebrow="Service introduction" title="Video">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/55">
            <div className="aspect-video w-full bg-slate-900">
              <video
                src={validVideo.previewUrl}
                controls
                preload="metadata"
                className="h-full w-full object-contain"
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            An optional service-introduction video from the seller.
          </p>
        </PreviewSection>
      ) : null}

      {portfolioLinks.length > 0 ? (
        <PreviewSection eyebrow="Trust evidence" title="Portfolio links">
          <div className="space-y-2">
            {portfolioLinks.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-500/30 hover:text-white"
              >
                <span className="min-w-0 truncate">{link}</span>
                <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Open
                </span>
              </a>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {hasValidLiveDemo ? (
        <PreviewSection eyebrow="Interactive demo" title="Live demo">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5">
            <p className="text-sm leading-6 text-slate-400">
              Buyers can open the live demo to explore an example of the service experience.
            </p>
            <a
              href={liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              Open live demo
            </a>
          </div>
        </PreviewSection>
      ) : null}

      <PreviewSection eyebrow="Questions" title="Frequently asked questions">
        {validFaqs.length > 0 ? (
          <div className="space-y-3">
            {validFaqs.map((faq, index) => (
              <details
                key={faq.id || `${faq.question}-${index}`}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-4"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-black text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70">
                  <span className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                    <span className="break-words">{String(faq.question).trim()}</span>
                  </span>
                  <span className="text-slate-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pl-7 text-sm leading-6 text-slate-400">
                  {String(faq.answer).trim()}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No FAQs have been added yet.
          </p>
        )}
      </PreviewSection>
    </div>
  );
}
