"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { TypingEngine } from "@/components/typing/TypingEngine";
import { useTypingStore } from "@/lib/typing/store";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import DUMMY_TEXTS_ID from "@/lib/typing/material.json";
import DUMMY_TEXTS_AR from "@/lib/typing/material-arab.json";
import DUMMY_TEXTS_EN from "@/lib/typing/material-eng.json";

interface PlayerState {
  presence_ref: string;
  name: string;
  status: "waiting" | "ready" | "finished";
  progress: number;
  wpm: number;
  isHost?: boolean;
}

// Ensure all players in the same room get the same text
const getRoomText = (roomCode: string, language: string) => {
  const DUMMY_TEXTS = language === "ar" ? DUMMY_TEXTS_AR : language === "en" ? DUMMY_TEXTS_EN : DUMMY_TEXTS_ID;
  let hash = 0;
  for (let i = 0; i < roomCode.length; i++) {
    hash = roomCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DUMMY_TEXTS.length;
  return DUMMY_TEXTS[index];
};

export default function BattleRoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = use(params);
  const [phase, setPhase] = useState<"lobby" | "race" | "result">("lobby");
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const { status, wpm, accuracy, errors, setText, startCountdown, tickCountdown, startRace, reset, input, playerName, startTime, endTime, language, setLanguage } = useTypingStore();
  const [countdown, setCountdown] = useState(3);
  const myPlayerStatus = useRef<PlayerState["status"]>("waiting");
  
  // Extract room language from prefix (e.g. ID-ABCDE)
  const roomLang = room.includes("-") ? room.split("-")[0].toLowerCase() : language;
  
  // Refs to avoid setInterval stale closures
  const inputRef = useRef(input);
  const wpmRef = useRef(wpm);
  const startTimeRef = useRef(startTime);
  const errorsRef = useRef(errors);
  
  useEffect(() => {
    inputRef.current = input;
    wpmRef.current = wpm;
    startTimeRef.current = startTime;
    errorsRef.current = errors;
  }, [input, wpm, startTime, errors]);

  useEffect(() => {
    // Force the local store language to match the room language so TypingEngine uses correct RTL
    if (["id", "en", "ar"].includes(roomLang) && language !== roomLang) {
      setLanguage(roomLang as "id" | "en" | "ar");
    }
    setText(getRoomText(room, roomLang));
    return () => reset();
  }, [setText, reset, room, roomLang, language, setLanguage]);

  // Realtime Setup
  useEffect(() => {
    if (!playerName) return; // Wait for name

    const supabase = createClient();
    const roomChannel = supabase.channel(`room:${room}`, {
      config: { 
        presence: { key: playerName },
        broadcast: { self: true }
      }
    });

    roomChannel
      .on("presence", { event: "sync" }, () => {
        const state = roomChannel.presenceState();
        
        setPlayers(prev => {
          const playerList: PlayerState[] = [];
          let index = 0;
          for (const [key, presences] of Object.entries(state)) {
            const p = presences[0] as any;
            const existing = prev.find(ep => ep.name === key);
            
            playerList.push({
              presence_ref: p.presence_ref,
              name: key,
              status: p.status, // We trust presence for status (waiting/finished)
              // Preserve broadcasted progress/wpm if they are higher, because presence data is often stale during race
              progress: existing && existing.progress > (p.progress || 0) ? existing.progress : (p.progress || 0),
              wpm: existing && existing.progress > 0 ? existing.wpm : (p.wpm || 0),
              isHost: index === 0
            });
            index++;
          }
          return playerList;
        });
      })
      .on("broadcast", { event: "start_race" }, () => {
        handleRemoteStart();
      })
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        setPlayers(prev => prev.map(p => 
          p.name === payload.name ? { ...p, progress: payload.progress, wpm: payload.wpm } : p
        ));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await roomChannel.track({
            status: "waiting",
            progress: 0,
            wpm: 0
          });
        }
      });

    setChannel(roomChannel);

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [room, playerName]);

  // Sync my progress to others periodically
  useEffect(() => {
    if (phase === "race" && status === "running" && channel) {
      const syncInterval = setInterval(() => {
        const roomText = getRoomText(room, roomLang);
        const currentInput = inputRef.current;
        const progress = (currentInput.length / roomText.length) * 100;
        
        let currentWpm = wpmRef.current;
        if (startTimeRef.current) {
          const timeMs = Date.now() - startTimeRef.current;
          const minutes = timeMs / 60000;
          if (minutes > 0) {
            const correctChars = currentInput.length - errorsRef.current;
            currentWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
          }
        }

        channel.send({
          type: "broadcast",
          event: "progress",
          payload: {
            name: playerName,
            progress,
            wpm: currentWpm
          }
        });
      }, 1000); 
      
      return () => clearInterval(syncInterval);
    }
  }, [phase, status, channel, room, roomLang, playerName]);

  // Handle Finish
  useEffect(() => {
    if (status === "finished" && channel && myPlayerStatus.current !== "finished") {
      myPlayerStatus.current = "finished";
      channel.track({
        status: "finished",
        progress: 100,
        wpm
      });
      setPhase("result");
      
      // Save result to DB
      const saveToDb = async () => {
        const supabase = createClient();
        const finalTimeMs = (endTime || Date.now()) - (startTime || Date.now());
        
        // Get race_id
        const { data: raceSession } = await supabase.from('race_sessions').select('id').eq('room_code', room).single();
        if (raceSession) {
          await supabase.from("race_players").insert({
            race_id: raceSession.id,
            display_name: playerName,
            is_guest: true,
            wpm,
            accuracy,
            errors,
            time_ms: finalTimeMs,
            language
          });
        }
      };
      saveToDb();
    }
  }, [status, channel, wpm, accuracy, errors, endTime, startTime, playerName, room]);

  const handleRemoteStart = () => {
    setPhase("race");
    startCountdown();
    let current = 3;
    setCountdown(current);
    const countInterval = setInterval(() => {
      current--;
      setCountdown(current);
      if (current === 0) {
        clearInterval(countInterval);
        startRace();
      }
    }, 1000);
  };

  const handleHostStart = async () => {
    if (channel) {
      // Update DB to prevent new joins
      const supabase = createClient();
      await supabase.from("race_sessions").update({ status: "running" }).eq("room_code", room);
      
      // Broadcast to everyone (including myself)
      channel.send({
        type: "broadcast",
        event: "start_race",
        payload: {}
      });
      // Start locally too since broadcast might not echo to sender depending on config
      handleRemoteStart();
    }
  };

  const myPlayer = players.find(p => p.name === playerName);
  const isHost = myPlayer?.isHost;

  return (
    <div className="flex min-h-screen flex-col items-center py-24 px-4 bg-background">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link href="/battle" className="text-muted-foreground hover:text-primary transition-colors">
          &larr; Leave Room
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Room: <span className="text-primary">{room}</span></h1>
      </div>

      {phase === "lobby" && (
        <div className="w-full max-w-2xl bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Lobby ({players.length}/10 Players)</h2>
            <p className="text-sm text-muted-foreground mt-1">Waiting for players to join and get ready...</p>
          </div>
          
          <ul className="divide-y divide-border">
            {players.length === 0 && <li className="p-4 text-center text-muted-foreground">Connecting to server...</li>}
            {players.map((player) => (
              <li key={player.name} className="p-4 flex justify-between items-center bg-card">
                <span className="font-medium text-lg flex items-center gap-2">
                  {player.name}
                  {player.isHost && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">HOST</span>}
                </span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>
                  ONLINE
                </span>
              </li>
            ))}
          </ul>
          
          <div className="p-6 bg-muted/30">
            {isHost ? (
              <button 
                onClick={handleHostStart}
                disabled={players.length < 1}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-md text-lg disabled:opacity-50"
              >
                Start Race
              </button>
            ) : (
              <div className="w-full py-4 bg-muted text-muted-foreground font-bold rounded-xl text-center text-lg border border-dashed">
                Waiting for host to start...
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "race" && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
          {/* Progress Bars */}
          <div className="w-full bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold mb-4">LIVE PROGRESS</h3>
            <div className="flex flex-col gap-4">
              {players.map(p => (
                <div key={p.name} className="flex items-center gap-4">
                  <div className="w-32 font-medium truncate flex items-center gap-2">
                    {p.name} {p.status === "finished" && "🏁"}
                  </div>
                  <div className="flex-grow h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out" 
                      style={{ width: `${Math.min(100, p.progress)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-bold text-muted-foreground">{Math.round(p.progress)}%</div>
                  <div className="w-20 text-right text-sm font-bold text-primary">{p.wpm} WPM</div>
                </div>
              ))}
            </div>
          </div>

          <TypingEngine />
          
          {status === "countdown" && (
            <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <span className="text-9xl font-extrabold animate-ping text-primary">
                {countdown > 0 ? countdown : "GO!"}
              </span>
            </div>
          )}
        </div>
      )}

      {phase === "result" && (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 w-full max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-8 text-primary">FINAL RESULT</h2>
          
          <div className="w-full max-w-md mx-auto bg-card border rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="p-4 border-b bg-muted/50 font-bold text-left">Ranking</div>
            <ul className="divide-y divide-border text-left">
              {[...players].sort((a, b) => b.wpm - a.wpm).map((p, index) => (
                <li key={p.name} className={`p-4 flex justify-between ${p.name === playerName ? "bg-primary/10" : ""}`}>
                  <span>{index + 1}. {p.name}</span>
                  <span className={`font-bold ${p.status === "finished" ? "text-primary" : "text-muted-foreground"}`}>
                    {p.status === "finished" ? `${p.wpm} WPM` : `${p.wpm} WPM (DNF)`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/battle"
              className="px-6 py-2 bg-secondary text-secondary-foreground font-semibold rounded-full hover:bg-secondary/80 transition shadow border"
            >
              Leave Room
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
