'use client';

import { useState, useEffect } from 'react';
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
  'Coconut',
  'Blueberry',
  'Blackberry',
  'Peach',
  'Cherry',
  'Apple',
  'Pear',
  'Watermelon',
  'Cucumber',
  'Kiwi',
  'Passionfruit',
  'Pomegranate',
  'Cranberry',
  'Ginger',
  'Cinnamon',
  'Nutmeg',
  'Clove',
  'Vanilla',
  'Chocolate',
  'Coffee',
  'Espresso',
  'Honey',
  'Agave',
  'Maple Syrup',
  'Simple Syrup',
  'Grenadine',
  'Bitters',
  'Tonic Water',
  'Soda Water',
  'Cola',
  'Cream',
  'Milk',
  'Egg White',
  'Almond',
  'Hazelnut',
  'Pepper',
  'Chili',
  'Rosemary',
  'Thyme',
  'Lavender',
  'Sage',
  'Other',
  "Apricot",
  "Oyster",
  "Rhubarb",

];


interface FormData {
  first_name: string;
  last_name: string;
  title: string;
  work_email: string;
  phone_number: string;
  company_name: string;
  flavor_guess: string;
  follow_up_permission: boolean | null;
}

export default function PlayPage() {
  const [form, setForm] = useState<FormData>({
    first_name: '',
    last_name: '',
    title: '',
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
  const [currentRestaurant, setCurrentRestaurant] = useState('Mystery');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('dashboard_config').select('restaurant_name').maybeSingle();
      if (data && data.restaurant_name) {
        setCurrentRestaurant(data.restaurant_name);
      }
    };
    fetchConfig();
  }, []);

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!form.first_name.trim()) errors.first_name = 'First name is required';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required';
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
      const { error: insertError, data: submissionData } = await supabase.from('submissions').insert({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        title: form.title.trim() || null,
        work_email: form.work_email.toLowerCase().trim(),
        phone_number: form.phone_number.trim(),
        company_name: form.company_name.trim(),
        flavor_guess: form.flavor_guess,
        follow_up_permission: form.follow_up_permission!,
        round: currentRestaurant,
      }).select();

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

  const getFilteredSuggestions = () => {
    if (!form.flavor_guess.trim()) return [];
    const input = form.flavor_guess.toLowerCase();
    return FLAVOR_OPTIONS.filter((flavor) =>
      flavor.toLowerCase().includes(input)
    );
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
        <div className="mb-6">
          <img 
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Ctext x='50%' y='60' font-size='60' font-weight='bold' fill='white' text-anchor='middle' font-family='Arial, sans-serif'%3EPaperchase%3C/text%3E%3C/svg%3E"
            alt="Paperchase"
            className="h-20 md:h-24 mx-auto"
          />
        </div>
        <h1
          className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight text-glow"
          style={{ color: 'var(--color-accent)' }}
        >
          TEST YOUR PALATE
        </h1>
        <p className="text-text-secondary mt-2 text-base md:text-lg">
          Can you guess the mystery  flavor?
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

        {/* Question 1: Name and Title */}
        <div className="mb-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              First Name <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="John"
              value={form.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
            />
            {fieldErrors.first_name && (
              <p className="mt-1.5 text-error text-xs">{fieldErrors.first_name}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Last Name <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Smith"
              value={form.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
            />
            {fieldErrors.last_name && (
              <p className="mt-1.5 text-error text-xs">{fieldErrors.last_name}</p>
            )}
          </div>
          <div className="md:w-1/3">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Title <span className="text-white/30 text-[10px]">(Optional)</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Mr, Dr, etc."
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
          </div>
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
            What restaurant group do you work for <span className="text-accent">*</span>
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
            What is the mystery ingredient in the {currentRestaurant} cocktail? <span className="text-accent">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className="input-field w-full"
              placeholder="Start typing to see suggestions..."
              value={form.flavor_guess}
              onChange={(e) => {
                updateField('flavor_guess', e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
            />
            {showSuggestions && getFilteredSuggestions().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1a0033] border border-accent/50 rounded-lg shadow-lg overflow-hidden">
                {getFilteredSuggestions().map((flavor) => (
                  <button
                    key={flavor}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-accent/20 transition-colors text-text-secondary hover:text-accent"
                    onClick={() => {
                      updateField('flavor_guess', flavor);
                      setShowSuggestions(false);
                    }}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            )}
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
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${form.follow_up_permission === true
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
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${form.follow_up_permission === false
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
