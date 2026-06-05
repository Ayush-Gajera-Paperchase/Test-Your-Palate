'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const FLAVOR_OPTIONS = [
  'Lemon',
  'Lime',
  'Orange',
  'Grapefruit',
  'Mint',
  'Basil',
  'Strawberry',
  'Raspberry',
  'Mango',
  'Pineapple',
  'Other',
];

interface FormData {
  full_name: string;
  work_email: string;
  phone_number: string;
  company_name: string;
  flavor_guess: string;
  follow_up_permission: boolean | null;
}

export default function PlayPage() {
  const [form, setForm] = useState<FormData>({
    full_name: '',
    work_email: '',
    phone_number: '',
    company_name: '',
    flavor_guess: '',
    follow_up_permission: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!form.full_name.trim()) errors.full_name = 'Name is required';
    if (!form.work_email.trim()) {
      errors.work_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.work_email)) {
      errors.work_email = 'Please enter a valid email';
    }
    if (!form.phone_number.trim()) errors.phone_number = 'Phone number is required';
    if (!form.company_name.trim()) errors.company_name = 'Company name is required';
    if (!form.flavor_guess) errors.flavor_guess = 'Please select a flavor';
    if (form.follow_up_permission === null) errors.follow_up_permission = 'Please select an option';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      // Check for duplicate email
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('work_email', form.work_email.toLowerCase().trim())
        .single();

      if (existing) {
        setError('This email has already been submitted. Each person can only enter once!');
        setSubmitting(false);
        return;
      }

      // Insert submission
      const { error: insertError } = await supabase.from('submissions').insert({
        full_name: form.full_name.trim(),
        work_email: form.work_email.toLowerCase().trim(),
        phone_number: form.phone_number.trim(),
        company_name: form.company_name.trim(),
        flavor_guess: form.flavor_guess,
        follow_up_permission: form.follow_up_permission!,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This email has already been submitted. Each person can only enter once!');
        } else {
          setError('Something went wrong. Please try again.');
          console.error('Insert error:', insertError);
        }
        setSubmitting(false);
        return;
      }

      // Decrement drinks remaining
      const { data: config } = await supabase
        .from('dashboard_config')
        .select('id, drinks_remaining')
        .maybeSingle();

      if (config && config.drinks_remaining > 0) {
        await supabase
          .from('dashboard_config')
          .update({ drinks_remaining: config.drinks_remaining - 1 })
          .eq('id', config.id);
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setError(null);
  };

  // Success Screen
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto fade-in">
          <div className="text-8xl mb-6">🍹</div>
          <h1
            className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-accent)' }}
          >
            Thank You!
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mb-2">
            Your entry has been submitted.
          </p>
          <p className="text-text-secondary text-lg md:text-xl mb-8">
            Good luck! 🎉
          </p>
          <div className="glass-card p-6">
            <p className="text-text-muted text-sm">
              Winners will be announced on the big screen. Keep an eye on the dashboard!
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-8 fade-in">
        <h1
          className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight text-glow"
          style={{ color: 'var(--color-accent)' }}
        >
          TEST YOUR PALATE
        </h1>
        <p className="text-text-secondary mt-2 text-base md:text-lg">
          Can you guess the hero flavor?
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg glass-card-solid p-6 md:p-8 slide-up"
        noValidate
      >
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm fade-in">
            {error}
          </div>
        )}

        {/* Question 1: Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
            What is your name? <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="John Smith"
            value={form.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
          />
          {fieldErrors.full_name && (
            <p className="mt-1.5 text-error text-xs">{fieldErrors.full_name}</p>
          )}
        </div>

        {/* Question 2: Email */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
            What is your work email? <span className="text-accent">*</span>
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="john@company.com"
            value={form.work_email}
            onChange={(e) => updateField('work_email', e.target.value)}
          />
          {fieldErrors.work_email && (
            <p className="mt-1.5 text-error text-xs">{fieldErrors.work_email}</p>
          )}
        </div>

        {/* Question 3: Phone */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
            What is your phone number? <span className="text-accent">*</span>
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="+44 7700 900000"
            value={form.phone_number}
            onChange={(e) => updateField('phone_number', e.target.value)}
          />
          {fieldErrors.phone_number && (
            <p className="mt-1.5 text-error text-xs">{fieldErrors.phone_number}</p>
          )}
        </div>

        {/* Question 4: Company */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
            What company do you work for? <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Paperchase"
            value={form.company_name}
            onChange={(e) => updateField('company_name', e.target.value)}
          />
          {fieldErrors.company_name && (
            <p className="mt-1.5 text-error text-xs">{fieldErrors.company_name}</p>
          )}
        </div>

        {/* Question 5: Flavor */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
            What is the hero flavor in the cocktail? <span className="text-accent">*</span>
          </label>
          <div className="relative">
            <select
              className="input-field appearance-none cursor-pointer pr-10"
              value={form.flavor_guess}
              onChange={(e) => updateField('flavor_guess', e.target.value)}
            >
              <option value="" disabled>
                Select a flavor...
              </option>
              {FLAVOR_OPTIONS.map((flavor) => (
                <option key={flavor} value={flavor} className="bg-deep-purple text-white">
                  {flavor}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {fieldErrors.flavor_guess && (
            <p className="mt-1.5 text-error text-xs">{fieldErrors.flavor_guess}</p>
          )}
        </div>

        {/* Question 6: Follow-up */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
            Can the Paperchase team follow up after the event once the hangover is gone?{' '}
            <span className="text-accent">*</span>
          </label>
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                form.follow_up_permission === true
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-white/12 bg-white/5 text-text-secondary hover:bg-white/8'
              }`}
            >
              <input
                type="radio"
                name="follow_up"
                className="sr-only"
                checked={form.follow_up_permission === true}
                onChange={() => updateField('follow_up_permission', true)}
              />
              <span className="font-medium">Yes</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                form.follow_up_permission === false
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-white/12 bg-white/5 text-text-secondary hover:bg-white/8'
              }`}
            >
              <input
                type="radio"
                name="follow_up"
                className="sr-only"
                checked={form.follow_up_permission === false}
                onChange={() => updateField('follow_up_permission', false)}
              />
              <span className="font-medium">No</span>
            </label>
          </div>
          {fieldErrors.follow_up_permission && (
            <p className="mt-1.5 text-error text-xs">{fieldErrors.follow_up_permission}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary w-full text-lg" disabled={submitting}>
          {submitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            'Submit My Guess 🍸'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-text-muted text-xs text-center">
        One entry per email address. Drink responsibly.
      </p>
    </main>
  );
}
