"use client";

import { useEffect, useRef, useState } from "react";
import { useTypingStore } from "@/lib/typing/store";
import { TypingEngine } from "@/components/typing/TypingEngine";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DUMMY_TEXTS_ID from "@/lib/typing/material.json";
import DUMMY_TEXTS_AR from "@/lib/typing/material-arab.json";
import DUMMY_TEXTS_EN from "@/lib/typing/material-eng.json";

export default function SoloRacePage() {
  const { status, wpm, accuracy, errors, setText, startCountdown, tickCountdown, startRace, reset, countdown, startTime, endTime, playerName, setPlayerName, language } = useTypingStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [qualifiesForHoF, setQualifiesForHoF] = useState(false);
  const [checkingQualification, setCheckingQualification] = useState(false);

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

  const handleSubmitScore = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const finalTimeMs = (endTime || Date.now()) - (startTime || Date.now());
      
      const { error } = await supabase.from("race_players").insert({
        display_name: playerName || "Anonymous Guest",
        is_guest: true,
        wpm: wpm,
        accuracy: accuracy,
        errors: errors,
        time_ms: finalTimeMs,
        language: language
      });

      if (error) {
        console.error("Error submitting score:", error);
        alert("Failed to submit score: " + error.message);
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Initialize text
    const DUMMY_TEXTS = language === "ar" ? DUMMY_TEXTS_AR : language === "en" ? DUMMY_TEXTS_EN : DUMMY_TEXTS_ID;
    const getRandomText = () => DUMMY_TEXTS[Math.floor(Math.random() * DUMMY_TEXTS.length)];
    setText(getRandomText());
    return () => reset();
  }, [setText, reset, language]);

  useEffect(() => {
    if (status === "finished") {
      const checkEligibility = async () => {
        setCheckingQualification(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("race_players")
            .select("wpm")
            .order("wpm", { ascending: false })
            .limit(20);
          
          if (error) throw error;
          
          if (!data || data.length < 20) {
            setQualifiesForHoF(true);
          } else {
            const twentiethScore = data[data.length - 1].wpm;
            if (wpm >= twentiethScore) {
              setQualifiesForHoF(true);
            } else {
              setQualifiesForHoF(false);
            }
          }
        } catch (e) {
          console.error(e);
          // If error fetching, fallback to allowing submission
          setQualifiesForHoF(true);
        } finally {
          setCheckingQualification(false);
        }
      };
      
      checkEligibility();
    }
  }, [status, wpm]);

  useEffect(() => {
    if (status === "countdown") {
      timerRef.current = setInterval(() => {
        const currentCount = useTypingStore.getState().countdown;
        if (currentCount > 1) {
          tickCountdown();
        } else {
          if (timerRef.current) clearInterval(timerRef.current);
          startRace();
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, tickCountdown, startRace]);

  const handleStart = () => {
    startCountdown();
  };

  const timeMs = (endTime || Date.now()) - (startTime || Date.now());
  const timeSeconds = startTime ? (timeMs / 1000).toFixed(2) : "0.00";

  return (
    <div className="flex min-h-screen flex-col items-center py-24 px-4 bg-background">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
          &larr; Back to Home
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Solo Race</h1>
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-4xl flex justify-between bg-muted/50 p-4 rounded-lg mb-8 text-lg font-medium shadow-sm border">
        <div>WPM: <span className="text-primary font-bold">{wpm}</span></div>
        <div>Accuracy: <span className="text-primary font-bold">{accuracy}%</span></div>
        <div>Errors: <span className="text-destructive font-bold">{errors}</span></div>
        <div className="text-muted-foreground">{timeSeconds}s</div>
      </div>

      <TypingEngine />

      {/* Controls / Result */}
      <div className="mt-12 h-32 flex flex-col items-center justify-center">
        {status === "idle" && (
          <div className="flex flex-col items-center gap-4">
            {!playerName ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                <input 
                  type="text" 
                  placeholder="Enter your nickname..." 
                  className="px-4 py-2 rounded-full border bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button 
                  onClick={handleSaveName}
                  className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition shadow-md"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-in fade-in">
                <p className="text-muted-foreground">
                  Playing as: <span className="font-bold text-foreground">{playerName}</span> 
                  <button onClick={() => { setPlayerName(""); localStorage.removeItem("typeRaceNickname"); }} className="text-sm underline ml-2 hover:text-primary">Change</button>
                </p>
                <button 
                  onClick={handleStart}
                  className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition shadow-md"
                >
                  Start Race
                </button>
              </div>
            )}
          </div>
        )}

        {status === "finished" && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold mb-4 text-primary">RACE COMPLETE</h2>
            
            {checkingQualification ? (
              <div className="mb-6 p-4 text-muted-foreground animate-pulse">
                Checking leaderboard eligibility...
              </div>
            ) : qualifiesForHoF ? (
              !isSubmitted ? (
                <div className="mb-6 bg-primary/10 border-primary/20 p-4 rounded-lg border max-w-sm mx-auto">
                  <p className="mb-2 font-bold text-primary">🎉 You beat the top 20!</p>
                  <p className="mb-4 text-sm">Do you want to save your result to the Hall of Fame?</p>
                  <button 
                    onClick={handleSubmitScore}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition shadow-md w-full disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Yes, Submit Score"}
                  </button>
                </div>
              ) : (
                <p className="mb-6 text-green-600 font-bold dark:text-green-400">✓ Score submitted successfully!</p>
              )
            ) : (
              <div className="mb-6 bg-muted/50 p-4 rounded-lg border max-w-sm mx-auto">
                <p className="mb-2 font-semibold">Good effort!</p>
                <p className="text-sm text-muted-foreground">However, your score of {wpm} WPM did not make it to the top 20. Try again to reach the Hall of Fame!</p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => { 
                  const DUMMY_TEXTS = language === "ar" ? DUMMY_TEXTS_AR : language === "en" ? DUMMY_TEXTS_EN : DUMMY_TEXTS_ID;
                  const randomText = DUMMY_TEXTS[Math.floor(Math.random() * DUMMY_TEXTS.length)];
                  reset(); 
                  setText(randomText); 
                  setIsSubmitted(false); 
                  handleStart(); 
                }}
                className="px-6 py-2 bg-secondary text-secondary-foreground font-semibold rounded-full hover:bg-secondary/90 transition shadow"
              >
                Race Again
              </button>
              <Link 
                href="/"
                className="px-6 py-2 bg-muted text-muted-foreground font-semibold rounded-full hover:bg-muted/80 transition shadow border"
              >
                Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
