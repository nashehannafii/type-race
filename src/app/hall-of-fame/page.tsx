import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0; // Disable caching for realtime leaderboard

export default async function HallOfFamePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  const fetchLeaderboard = async (lang: string) => {
    if (!supabase) return { data: null, error: { message: "Invalid Supabase URL. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL starts with http/https." } };
    
    let query = supabase
      .from("race_players")
      .select("id, display_name, wpm, accuracy, time_ms")
      .eq("language", lang)
      .order("wpm", { ascending: false })
      .limit(20);

    // Apply time filter
    if (filter === "today") {
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("joined_at", threshold);
    } else if (filter === "week") {
      const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("joined_at", threshold);
    } else if (filter === "month") {
      const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("joined_at", threshold);
    }

    return await query;
  };

  const [resId, resEn, resAr] = await Promise.all([
    fetchLeaderboard("id"),
    fetchLeaderboard("en"),
    fetchLeaderboard("ar")
  ]);

  const globalError = resId.error || resEn.error || resAr.error;

  const renderTable = (title: string, flag: string, data: any[]) => {
    const hasData = data && data.length > 0;
    return (
      <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 bg-muted/30 border-b flex items-center gap-2">
          <span className="text-2xl">{flag}</span>
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <div className="p-4 flex-grow">
          {!hasData ? (
            <div className="text-center py-12 text-muted-foreground">
              <span className="text-3xl block mb-2">📭</span>
              <p className="text-sm">Belum ada data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="p-2 font-semibold">#</th>
                    <th className="p-2 font-semibold">Player</th>
                    <th className="p-2 font-semibold text-right">WPM</th>
                    <th className="p-2 font-semibold text-right">Acc</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((player, index) => {
                    const rank = index + 1;
                    return (
                      <tr key={player.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-2 font-medium">
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                        </td>
                        <td className="p-2 font-semibold truncate max-w-[100px]" title={player.display_name}>{player.display_name}</td>
                        <td className="p-2 text-right text-primary font-bold">{player.wpm}</td>
                        <td className="p-2 text-right text-muted-foreground text-xs">{player.accuracy}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center py-24 px-4 bg-background">
      <div className="w-full max-w-6xl flex justify-between items-center mb-12">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-primary">HALL OF FAME</h1>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      <div className="w-full max-w-6xl bg-card border rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="flex gap-4 p-4 bg-muted/50 overflow-x-auto justify-center">
          <Link href="/hall-of-fame?filter=all" className={`px-6 py-2 font-medium rounded-full text-sm transition-colors ${!filter || filter === 'all' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}>All Time</Link>
          <Link href="/hall-of-fame?filter=today" className={`px-6 py-2 font-medium rounded-full text-sm transition-colors ${filter === 'today' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}>Today (24h)</Link>
          <Link href="/hall-of-fame?filter=week" className={`px-6 py-2 font-medium rounded-full text-sm transition-colors ${filter === 'week' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}>This Week</Link>
          <Link href="/hall-of-fame?filter=month" className={`px-6 py-2 font-medium rounded-full text-sm transition-colors ${filter === 'month' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}>This Month</Link>
        </div>
      </div>

      {globalError ? (
        <div className="w-full max-w-6xl p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-center">
          <p className="font-bold text-lg mb-2">Error fetching data:</p>
          <p>{globalError.message}</p>
          <p className="mt-2 opacity-80">Make sure you have created the `race_players` table in Supabase.</p>
        </div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderTable("Indonesia", "🇮🇩", resId.data || [])}
          {renderTable("English", "🇬🇧", resEn.data || [])}
          {renderTable("Arab", "🇸🇦", resAr.data || [])}
        </div>
      )}
    </div>
  );
}
