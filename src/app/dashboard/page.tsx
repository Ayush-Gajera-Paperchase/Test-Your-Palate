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

  // WordCycler.jsx
  return (
    <span className="text-[#FF6D2F] font-bold transition-all duration-300">
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

      {/* Top Header - Paperchase Logo with Dark Blue Background */}
      <header className="w-full flex-shrink-0 z-10 flex justify-center border-b border-white/10 py-[3%] relative bg-gradient-to-r from-[#001a4d] via-[#003399] to-[#001a4d]">
        <div className="absolute inset-0 bg-[#23044a]/80 to-transparent pointer-events-none"></div>
        <h1 className="text-[8vw] font-bold tracking-tight lowercase text-white relative z-10">
          paperchase
        </h1>
      </header>

      {/* Main Content Grid - 2 column layout for 3x3 display */}
      <div className="flex-1 flex items-center justify-center px-[2%] py-[2%] z-10 w-full overflow-hidden">
        <div className="w-full h-full grid grid-cols-2 gap-[2%] max-w-full">

        {/* Left Card - Stats */}
        <div className="rounded-[2vw] p-[3%] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#23044a] to-[#13002b] border border-white/10">

          <p className="text-[1.2vw] font-semibold tracking-[0.15em] text-white/60 mb-[2%] uppercase">
            ROUND {round.id}
          </p>
          <h2 className="text-[4.5vw] font-black uppercase tracking-wider mb-[3%]">
            {round.restaurant}
          </h2>
          <p className="text-[1.5vw] text-white/80 leading-tight mb-[4%] font-light">
            {round.stat}
          </p>

          <p className="text-[2vw] font-semibold text-center flex flex-wrap justify-center gap-x-[1%] mt-auto">
            <span className="text-white">Paperchase</span>
            <WordCycler />
            <span className="text-white">every pence</span>
          </p>

        </div>

        {/* Right Card - Palate & Count */}
        <div className="rounded-[2vw] p-[3%] flex flex-col shadow-2xl relative border border-[#FF6D2F]/40 backdrop-blur-md bg-black/40 overflow-hidden">

          <div className="mb-[2%] flex-shrink-0">
            <h2 className="text-[3vw] font-bold mb-[1%]">
              Test Your <span className="text-[#a580e2]">Palate</span>
            </h2>
            <p className="text-white/80 text-[1.2vw] leading-snug font-light">
              Guess the mystery cocktail ingredient<br />
              for a chance to win<br />
              <span className="text-[#a580e2] font-semibold">dinner for two at {round.restaurant}.</span>
            </p>
          </div>

          <div className="rounded-[1.5vw] bg-gradient-to-b from-white/8 to-transparent border border-white/15 p-[2%] mb-[2%] flex items-center justify-between flex-shrink-0">
            <div className="flex-1 border-r border-white/15 pr-[2%]">
              <p className="text-[0.9vw] font-semibold tracking-widest text-white/50 mb-[0.5%] uppercase leading-tight">
                THEORETICAL<br />INVENTORY
              </p>
              <div className="flex items-center gap-[1%]">
                <img 
                  src="/sto-logo.svg" 
                  alt="StockTake Online" 
                  className="w-[2.5vw] h-[2.5vw] object-contain flex-shrink-0 rounded-lg"
                />
                <span className="font-bold text-[0.95vw] leading-tight">
                  STOCKTAKE<br />ONLINE
                </span>
              </div>
            </div>

            <div className="flex-1 pl-[2%] text-center">
              <p className="text-[0.9vw] font-semibold tracking-widest text-white/50 mb-[0.5%] uppercase leading-tight">
                COCKTAILS<br />REMAINING
              </p>
              <p className={`text-[4vw] font-bold text-[#a580e2] transition-transform duration-300 ${drinksAnimating ? 'scale-110' : 'scale-100'}`}>
                {config.drinks_remaining}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-[1%] overflow-hidden">
            {round.nextRound && (
              <div className="flex-shrink-0">
                <p className="text-[0.9vw] font-semibold tracking-widest text-white/50 mb-[0.5%] uppercase leading-tight">
                  NEXT ROUND
                </p>
                <p className="text-[1.5vw] font-semibold text-[#FF6D2F]">
                  {round.nextRound}
                </p>
              </div>
            )}

            {round.previousIngredientTitle && (
              <div className="pt-[1%] border-t border-white/10 flex-shrink-0">
                <p className="text-[0.9vw] font-semibold tracking-widest text-white/50 mb-[0.5%] uppercase leading-tight">
                  {round.previousIngredientTitle}
                </p>
                <p className="text-[1.5vw] font-semibold text-[#FF6D2F]">
                  {round.previousIngredient}
                </p>
              </div>
            )}

            <div className="pt-[1%] flex justify-center gap-[0.8%] text-[#FF6D2F] font-bold tracking-widest text-[0.95vw] uppercase flex-shrink-0">
              <span>SCAN</span>
              <span className="text-white/30">•</span>
              <span>SIP</span>
              <span className="text-white/30">•</span>
              <span>GUESS</span>
              <span className="text-white/30">•</span>
              <span>WIN</span>
            </div>
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
