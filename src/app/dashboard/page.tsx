'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DashboardConfig, Winner } from '@/types/database';
import { getRoundConfig, ROUNDS } from '@/config/rounds';

const PAYS_WORDS = ['reconciles', 'reports', 'tracks', 'pays'];

function WordCycler() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PAYS_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[#FF6D2F] font-bold transition-all duration-300 inline-block min-w-[140px]">
      {PAYS_WORDS[index]}
    </span>
  );
}

export default function DashboardPage() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drinksAnimating, setDrinksAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      const configRes = await supabase.from('dashboard_config').select('*').maybeSingle();
      const winnersRes = await supabase.from('winners').select('*').order('created_at', { ascending: false });

      if (configRes.data) {
        setConfig(configRes.data);
      } else {
        // Fallback if db is empty
        setConfig({
          id: 'temp',
          restaurant_name: 'Dishoom',
          drinks_remaining: 150,
          current_round: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      if (winnersRes.data) setWinners(winnersRes.data);
      setLoading(false);
    };

    fetchData();

    // Subscribe to dashboard_config changes
    const configChannel = supabase
      .channel('dashboard-config-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dashboard_config' },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setConfig(payload.new as DashboardConfig);
            setDrinksAnimating(true);
            setTimeout(() => setDrinksAnimating(false), 600);
          }
        }
      )
      .subscribe();

    // Subscribe to winners changes
    const winnersChannel = supabase
      .channel('winners-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'winners' },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setWinners((prev) => [payload.new as Winner, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'winners' },
        (payload) => {
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            setWinners((prev) =>
              prev.filter((w) => w.id !== (payload.old as Winner).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(configChannel);
      supabase.removeChannel(winnersChannel);
    };
  }, []);


  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#110022]">
        <div className="w-16 h-16 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  // Ensure current_round exists (fallback to 1 if not yet added to DB)
  const roundId = config.current_round || 1;
  const round = getRoundConfig(roundId);

  return (
    <main className="min-h-screen flex flex-col items-center relative overflow-hidden bg-black text-white font-[family-name:var(--font-body)]">

      {/* Background Video / Image placeholder */}
      {/* Assuming videos are in public/videos/. Using a solid dark color as fallback if not present. */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          key={round.videoSrc}
          className="w-full h-full object-cover opacity-30"
        >
          <source src={round.videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#110022] via-[#110022]/60 to-transparent mix-blend-multiply" />
      </div>

      {/* Top Header */}
      <header className="w-full py-6 z-10 flex justify-center bg-[#18003a]/80 backdrop-blur-sm border-b border-white/5">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight lowercase">
          paperchase
        </h1>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl flex-1 flex flex-col md:flex-row items-stretch justify-center gap-6 p-6 md:p-12 z-10 mt-4 md:mt-12">

        {/* Left Card - Stats */}
        <div className="flex-1 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#23044a] to-[#13002b] border border-white/5">
          <p className="text-xs md:text-sm font-semibold tracking-[0.3em] text-white/50 mb-4 uppercase">
            ROUND {round.id}
          </p>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-6">
            {round.restaurant}
          </h2>
          <p className="text-lg md:text-2xl text-white/80 max-w-sm mx-auto leading-relaxed mb-12">
            {round.stat}
          </p>
          <p className="text-xl md:text-3xl font-medium mt-auto">
            Paperchase <WordCycler /><br />
            every pence
          </p>
        </div>

        {/* Right Card - Palate & Count */}
        <div className="flex-1 rounded-3xl p-8 md:p-12 flex flex-col shadow-2xl relative border border-[#FF6D2F]/30  backdrop-blur-md">

          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Test Your <span className="text-[#a580e2]">Palate</span>
            </h2>
            <p className="text-white/80 text-sm md:text-base leading-relaxed">
              Guess the mystery cocktail ingredient<br />
              for a chance to win<br />
              <span className="text-[#a580e2] font-semibold">dinner for two at  {round.restaurant}.</span>
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-6 mb-8 flex items-center justify-between shadow-inner">
            <div className="flex-1 border-r border-white/10 pr-4">
              <p className="text-[10px] md:text-xs font-semibold tracking-widest text-white/50 mb-2 uppercase">
                THEORETICAL INVENTORY
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6D2F]/20 border border-[#FF6D2F] flex items-center justify-center font-bold text-[#FF6D2F] rounded-md">
                  StO
                </div>
                <span className="font-bold text-sm md:text-base leading-tight">
                  STOCKTAKE<br />ONLINE
                </span>
              </div>
            </div>

            <div className="flex-1 pl-6 text-center">
              <p className="text-[10px] md:text-xs font-semibold tracking-widest text-white/50 mb-1 uppercase">
                COCKTAILS REMAINING
              </p>
              <p className={`text-5xl md:text-7xl font-bold text-[#a580e2] transition-transform duration-300 ${drinksAnimating ? 'scale-110' : 'scale-100'}`}>
                {config.drinks_remaining}
              </p>
            </div>
          </div>

          <div className="mt-auto text-center space-y-8">
            {round.nextRound && (
              <div>
                <p className="text-[10px] md:text-xs font-semibold tracking-widest text-white/50 mb-1 uppercase">
                  NEXT ROUND
                </p>
                <p className="text-xl md:text-2xl font-semibold text-[#FF6D2F]">
                  {round.nextRound}
                </p>
              </div>
            )}

            {round.previousIngredientTitle && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] md:text-xs font-semibold tracking-widest text-white/50 mb-1 uppercase">
                  {round.previousIngredientTitle}
                </p>
                <p className="text-xl md:text-2xl font-semibold text-[#FF6D2F]">
                  {round.previousIngredient}
                </p>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-4 text-[#FF6D2F] font-bold tracking-widest text-sm md:text-base uppercase">
              <span>SCAN</span>
              <span>SIP</span>
              <span>GUESS</span>
              <span>WIN</span>
            </div>
          </div>

        </div>
      </div>

      {/* Winners Ticker */}
      {winners.length > 0 && (
        <div className="absolute bottom-0 w-full bg-[#FF6D2F]/90 backdrop-blur-md text-white py-3 z-50 overflow-hidden border-t border-[#FF6D2F]">
          <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] items-center text-lg font-bold tracking-widest uppercase">
            <span className="mx-4">🏆 WINNERS:</span>
            {winners.map((winner, i) => (
              <span key={winner.id} className="mx-4 flex items-center gap-2">
                {winner.winner_name}
                {i < winners.length - 1 && <span className="text-white/50 mx-2">•</span>}
              </span>
            ))}
            {/* Duplicate for infinite scroll effect */}
            <span className="mx-4 ml-12">🏆 WINNERS:</span>
            {winners.map((winner, i) => (
              <span key={winner.id + '-dup'} className="mx-4 flex items-center gap-2">
                {winner.winner_name}
                {i < winners.length - 1 && <span className="text-white/50 mx-2">•</span>}
              </span>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
          `}} />
        </div>
      )}
    </main>
  );
}
