"use client";

import { useEffect, useRef } from "react";
import { useTypingStore } from "@/lib/typing/store";
import { cn } from "@/lib/utils";

export function TypingEngine() {
  const { text, input, status, countdown, handleInput, handleBackspace, language } = useTypingStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle global keyboard input if running
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "running") return;

      // Prevent default scrolling for Space
      if (e.key === " ") e.preventDefault();

      if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleInput(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, handleInput, handleBackspace]);

  if (!text) return null;

  const characters = text.split("");

  return (
    <div 
      ref={containerRef}
      dir={language === "ar" ? "rtl" : "ltr"}
      className="relative w-full max-w-4xl p-8 bg-card text-card-foreground rounded-xl border shadow-sm font-mono text-2xl leading-relaxed outline-none"
      tabIndex={0}
    >
      <div className="break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
        {characters.map((char, index) => {
          let state = "untyped";
          
          if (index < input.length) {
            state = input[index] === char ? "correct" : "incorrect";
          } else if (index === input.length && status === "running") {
            state = "current";
          }

          return (
            <span
              key={index}
              className={cn(
                "transition-colors duration-75",
                {
                  "text-muted-foreground/50": state === "untyped",
                  "text-primary": state === "correct",
                  "text-destructive bg-destructive/10 rounded-sm": state === "incorrect",
                  "text-foreground border-b-2 border-primary animate-pulse": state === "current",
                  "bg-muted/30": char === " " && state === "incorrect", // Highlight wrong spaces
                }
              )}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>
      
      {/* Overlay when not running */}
      {status !== "running" && status !== "finished" && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
          {status === "countdown" ? (
            <span className="text-6xl font-bold animate-ping text-primary">
              {countdown || "GO!"}
            </span>
          ) : (
            <span className="text-xl font-semibold bg-background px-4 py-2 rounded-md shadow">
              Click Start to begin
            </span>
          )}
        </div>
      )}
    </div>
  );
}
