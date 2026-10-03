import React from 'react';
import { Check } from 'lucide-react';

const inputClass = (error) =>
  `w-full rounded-2xl border bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition ${
    error
      ? 'border-red-500/50 focus:border-red-400'
      : 'border-slate-800 focus:border-cyan-500/60 hover:border-slate-700'
  }`;

function FieldMessage({ id, children, error = false }) {
  if (!children) return null;

  return (
    <p
      id={id}
      role={error ? 'alert' : undefined}
      className={`text-xs leading-5 ${
        error ? 'text-red-400' : 'text-slate-500'
      }`}
    >
      {children}
    </p>
  );
}

export default function GigCategorySpecificFields({
  fields = [],
  values = {},
  errors = {},
  touchedFields = {},
  onChange
}) {
  if (!fields.length) return null;

  return (
    <section
      aria-labelledby="gig-service-specific-details-heading"
      className="rounded-3xl border border-cyan-500/15 bg-cyan-500/[0.025] p-5 sm:p-7"
    >
      <div className="max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
          Service-specific details
        </p>
        <h3
          id="gig-service-specific-details-heading"
          className="mt-2 text-xl font-black text-white sm:text-2xl"
        >
          Details buyers should know
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          These fields are shown only because of the category or service type
          you selected. They help buyers understand the exact shape of your offer.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {fields.map((field) => {
          const error = touchedFields[field.key] ? errors[field.key] : '';
          const value =
            field.type === 'multi-select'
              ? Array.isArray(values[field.key])
                ? values[field.key]
                : []
              : field.type === 'checkbox'
                ? Boolean(values[field.key])
                : values[field.key] ?? '';

          const describedBy = [
            `${field.key}-description`,
            error ? `${field.key}-error` : null
          ]
            .filter(Boolean)
            .join(' ') || undefined;

          return (
            <div
              key={field.key}
              className={
                field.type === 'textarea'
                  ? 'lg:col-span-2 space-y-2.5'
                  : 'space-y-2.5'
              }
            >
              {field.type === 'checkbox' ? (
                <label
                  htmlFor={`gig-specific-${field.key}`}
                  className={`flex min-h-[52px] cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-cyan-400/60 ${
                    error
                      ? 'border-red-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    id={`gig-specific-${field.key}`}
                    type="checkbox"
                    checked={value}
                    onChange={(event) => onChange(field.key, event.target.checked)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-white">
                      {field.label}
                    </span>
                    {field.description ? (
                      <span
                        id={`${field.key}-description`}
                        className="mt-1 block text-xs leading-5 text-slate-500"
                      >
                        {field.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ) : (
                <>
                  <label
                    htmlFor={`gig-specific-${field.key}`}
                    className="block text-xs font-black uppercase tracking-wider text-slate-300"
                  >
                    {field.label}
                    {field.required ? (
                      <span className="text-pink-500"> *</span>
                    ) : (
                      <span className="ml-1 text-slate-600">(optional)</span>
                    )}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={`gig-specific-${field.key}`}
                      value={value}
                      onChange={(event) => onChange(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      rows={4}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy}
                      className={`${inputClass(error)} resize-y`}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`gig-specific-${field.key}`}
                      value={value}
                      onChange={(event) => onChange(field.key, event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy}
                      className={inputClass(error)}
                    >
                      <option value="">Select an option…</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'multi-select' ? (
                    <div
                      id={`gig-specific-${field.key}`}
                      role="group"
                      aria-describedby={describedBy}
                      aria-invalid={Boolean(error)}
                      className={`rounded-2xl border p-3 ${
                        error
                          ? 'border-red-500/50'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(field.options || []).map((option) => {
                          const checked = value.includes(option.value);

                          return (
                            <label
                              key={option.value}
                              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:border-cyan-500/30 hover:text-cyan-200"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? value.filter((item) => item !== option.value)
                                    : [...value, option.value];

                                  onChange(field.key, next);
                                }}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                              />
                              <span className="min-w-0">{option.label}</span>
                              {checked ? (
                                <Check
                                  className="ml-auto h-4 w-4 shrink-0 text-cyan-400"
                                  aria-hidden="true"
                                />
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <input
                      id={`gig-specific-${field.key}`}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={value}
                      onChange={(event) => onChange(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      maxLength={
                        field.type === 'number' ? undefined : field.maxLength
                      }
                      inputMode={field.type === 'number' ? 'decimal' : undefined}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy}
                      className={inputClass(error)}
                    />
                  )}

                  {field.description ? (
                    <FieldMessage id={`${field.key}-description`}>
                      {field.description}
                    </FieldMessage>
                  ) : null}
                </>
              )}

              {error ? (
                <FieldMessage id={`${field.key}-error`} error>
                  {error}
                </FieldMessage>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
