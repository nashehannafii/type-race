"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTypingStore } from "@/lib/typing/store";

export default function BattleIndexPage() {
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const { playerName, setPlayerName, language } = useTypingStore();
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("typeRaceNickname");
    if (savedName) setPlayerName(savedName);
  }, [setPlayerName]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      localStorage.setItem("typeRaceNickname", nameInput.trim());
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) { alert("Please set a nickname first."); return; }
    
    if (roomCode.trim().length === 8 && roomCode.includes("-")) {
      setIsLoading(true);
      const supabase = createClient();
      const code = roomCode.toUpperCase();
      
      const { data, error } = await supabase
        .from("race_sessions")
        .select("id, status")
        .eq("room_code", code)
        .single();
        
      if (error || !data) {
        alert("Room not found!");
        setIsLoading(false);
        return;
      }
      
      if (data.status !== 'waiting') {
        alert("Race has already started or finished in this room!");
        setIsLoading(false);
        return;
      }
      
      router.push(`/battle/${code}`);
    } else {
      alert("Please enter a valid 8-character room code (e.g. ID-ABCDE).");
    }
  };

  const handleCreate = async () => {
    if (!playerName) { alert("Please set a nickname first."); return; }
    
    setIsLoading(true);
    const supabase = createClient();
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const finalRoomCode = `${language.toUpperCase()}-${randomPart}`;
    
    const { error } = await supabase.from("race_sessions").insert({ room_code: finalRoomCode, status: "waiting" });
    if (error) {
      alert("Error creating room: " + error.message);
      setIsLoading(false);
      return;
    }
    
    router.push(`/battle/${finalRoomCode}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-sm border text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Multiplayer Battle</h1>
        <p className="text-muted-foreground mb-8">Race against 2-10 players in real-time!</p>

        {!playerName ? (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <p className="font-medium text-left">Enter your nickname to join:</p>
            <input 
              type="text" 
              placeholder="e.g. SpeedRacer99" 
              className="w-full px-4 py-4 rounded-xl border bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button 
              onClick={handleSaveName}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-md text-lg"
            >
              Save Nickname
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in">
            <div className="mb-6 flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
              <span className="text-sm text-muted-foreground">Playing as: <strong className="text-foreground">{playerName}</strong></span>
              <button onClick={() => { setPlayerName(""); localStorage.removeItem("typeRaceNickname"); }} className="text-sm underline hover:text-primary">Change</button>
            </div>

            <button 
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-md mb-8 text-lg disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create New Battle"}
            </button>

            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Enter Room Code (e.g. ID-ABCDE)" 
                maxLength={8}
                className="w-full px-4 py-4 rounded-xl border bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-center uppercase tracking-widest text-lg font-bold"
                value={roomCode}
                onChange={(e) => {
                  // automatically add dash if they type the language part
                  let val = e.target.value.toUpperCase();
                  if (val.length === 2 && !val.includes('-')) val += '-';
                  setRoomCode(val);
                }}
              />
              <button 
                type="submit"
                disabled={roomCode.length !== 8 || isLoading}
                className="w-full py-4 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition shadow-md disabled:opacity-50 text-lg"
              >
                {isLoading ? "Joining..." : "Join Battle"}
              </button>
            </form>
          </div>
        )}
      </div>

      <Link href="/" className="mt-8 text-muted-foreground hover:text-primary transition-colors">
        &larr; Back to Home
      </Link>
    </div>
  );
}
