'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DashboardConfig, Submission, Winner } from '@/types/database';

const ADMIN_KEY = 'typ_admin_auth';
const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ADMIN_KEY);
      if (stored === 'true') {
        setAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Check against the known password
    if (password === 'paperchase2026') {
      localStorage.setItem(ADMIN_KEY, 'true');
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 fade-in">
            <div className="text-5xl mb-4">🔐</div>
            <h1
              className="font-[family-name:var(--font-display)] text-3xl font-bold"
              style={{ color: 'var(--color-accent)' }}
            >
              Admin Access
            </h1>
            <p className="text-text-secondary mt-2">Enter the admin password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="glass-card-solid p-8 slide-up">
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm fade-in">
                {loginError}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

// ============================================
// Admin Dashboard (post-login)
// ============================================
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  // Config form
  const [editRestaurant, setEditRestaurant] = useState('');
  const [editDrinks, setEditDrinks] = useState(0);
  const [editRound, setEditRound] = useState(1);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Pagination & search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Action states
  const [winnerLoading, setWinnerLoading] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    const configRes = await supabase.from('dashboard_config').select('*').maybeSingle();
    const winnersRes = await supabase.from('winners').select('*').order('created_at', { ascending: false });

    if (configRes.data) {
      setConfig(configRes.data);
      setEditRestaurant(configRes.data.restaurant_name);
      setEditDrinks(configRes.data.drinks_remaining);
      setEditRound(configRes.data.current_round || 1);
    } else {
      setEditRestaurant('Dishoom');
      setEditDrinks(150);
      setEditRound(1);
    }

    if (winnersRes.data) setWinners(winnersRes.data);
    setLoading(false);
  }, []);

  // Fetch submissions with pagination and search
  const fetchSubmissions = useCallback(async () => {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('submissions')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,work_email.ilike.%${search}%,company_name.ilike.%${search}%`
      );
    }

    const { data, count } = await query;

    if (data) setSubmissions(data);
    if (count !== null) setTotalCount(count);
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Save config
  const saveConfig = async () => {
    setConfigSaving(true);
    setConfigSaved(false);

    if (!config) {
      // Database is empty, insert a new config row
      const { data } = await supabase
        .from('dashboard_config')
        .insert({
          restaurant_name: editRestaurant,
          drinks_remaining: editDrinks,
          current_round: editRound,
        })
        .select()
        .single();
        
      if (data) {
        setConfig(data);
      }
    } else {
      // Database has config, update it
      await supabase
        .from('dashboard_config')
        .update({
          restaurant_name: editRestaurant,
          drinks_remaining: editDrinks,
          current_round: editRound,
        })
        .eq('id', config.id);

      setConfig((prev) =>
        prev
          ? { ...prev, restaurant_name: editRestaurant, drinks_remaining: editDrinks, current_round: editRound }
          : prev
      );
    }

    setConfigSaving(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  // Mark winner
  const markWinner = async (submission: Submission) => {
    setWinnerLoading(submission.id);

    // Update submission
    await supabase
      .from('submissions')
      .update({ is_winner: true })
      .eq('id', submission.id);

    // Insert winner
    await supabase.from('winners').insert({
      submission_id: submission.id,
      winner_name: submission.full_name,
    });

    // Refresh
    await Promise.all([fetchSubmissions(), fetchData()]);
    setWinnerLoading(null);
  };

  // Remove winner
  const removeWinner = async (winner: Winner) => {
    await supabase.from('winners').delete().eq('id', winner.id);

    // Unmark submission
    await supabase
      .from('submissions')
      .update({ is_winner: false })
      .eq('id', winner.submission_id);

    await Promise.all([fetchSubmissions(), fetchData()]);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <h1
            className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--color-accent)' }}
          >
            Admin Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your Test Your Palate event
          </p>
        </div>
        <button onClick={onLogout} className="btn-secondary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
            Total Submissions
          </p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-accent">
            {totalCount}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
            Drinks Remaining
          </p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-accent">
            {config?.drinks_remaining ?? 0}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Winners</p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-accent">
            {winners.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config + Winners */}
        <div className="lg:col-span-1 space-y-6">
          {/* Dashboard Configuration */}
          <div className="glass-card-solid p-6 slide-up">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Dashboard Config
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Current Round
                </label>
                <select
                  className="input-field"
                  value={editRound}
                  onChange={(e) => setEditRound(parseInt(e.target.value) || 1)}
                >
                  <option value={1} className="bg-deep-purple">Round 1: Dishoom</option>
                  <option value={2} className="bg-deep-purple">Round 2: Eve Bar</option>
                  <option value={3} className="bg-deep-purple">Round 3: Lilibet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Restaurant Name (Fallback)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editRestaurant}
                  onChange={(e) => setEditRestaurant(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Drinks Remaining
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={editDrinks}
                  onChange={(e) => setEditDrinks(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <button
                onClick={saveConfig}
                disabled={configSaving}
                className="btn-primary w-full"
              >
                {configSaving ? 'Saving...' : configSaved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Winners List */}
          <div className="glass-card-solid p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Winners ({winners.length})
            </h2>

            {winners.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">
                No winners yet. Mark submissions as winners below.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {winners.map((winner) => (
                  <li
                    key={winner.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold">
                        W
                      </div>
                      <span className="font-medium text-sm">{winner.winner_name}</span>
                    </div>
                    <button
                      onClick={() => removeWinner(winner)}
                      className="btn-danger text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Submissions */}
        <div className="lg:col-span-2">
          <div className="glass-card-solid p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Submissions ({totalCount})
              </h2>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  className="input-field pl-9 text-sm"
                  placeholder="Search name, email, company..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium">
                      Name
                    </th>
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium hidden md:table-cell">
                      Phone
                    </th>
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium hidden lg:table-cell">
                      Company
                    </th>
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium">
                      Flavor
                    </th>
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium hidden lg:table-cell">
                      Follow Up
                    </th>
                    <th className="text-left py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium hidden md:table-cell">
                      Time
                    </th>
                    <th className="text-right py-3 px-2 text-text-muted uppercase tracking-wider text-xs font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-text-muted">
                        {search ? 'No results found.' : 'No submissions yet.'}
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium">{sub.full_name}</td>
                        <td className="py-3 px-2 text-text-secondary text-xs">
                          {sub.work_email}
                        </td>
                        <td className="py-3 px-2 text-text-secondary text-xs hidden md:table-cell">
                          {sub.phone_number}
                        </td>
                        <td className="py-3 px-2 text-text-secondary text-xs hidden lg:table-cell">
                          {sub.company_name}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/25">
                            {sub.flavor_guess}
                          </span>
                        </td>
                        <td className="py-3 px-2 hidden lg:table-cell">
                          <span
                            className={`text-xs font-medium ${
                              sub.follow_up_permission ? 'text-success' : 'text-text-muted'
                            }`}
                          >
                            {sub.follow_up_permission ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-text-muted text-xs hidden md:table-cell">
                          {new Date(sub.submitted_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {sub.is_winner ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                              🏆 Winner
                            </span>
                          ) : (
                            <button
                              onClick={() => markWinner(sub)}
                              disabled={winnerLoading === sub.id}
                              className="btn-winner text-xs"
                            >
                              {winnerLoading === sub.id ? (
                                <svg
                                  className="animate-spin h-3.5 w-3.5"
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
                              ) : (
                                '⭐ Mark Winner'
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                <p className="text-text-muted text-xs">
                  Page {page} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-xs disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary text-xs disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
