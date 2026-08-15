import { create } from "zustand";

export type RaceStatus = "idle" | "countdown" | "running" | "finished";

interface TypingState {
  text: string;
  input: string;
  status: RaceStatus;
  startTime: number | null;
  endTime: number | null;
  countdown: number;
  errors: number;
  wpm: number;
  accuracy: number;
  playerName: string;
  language: "id" | "ar" | "en";

  setLanguage: (lang: "id" | "ar" | "en") => void;
  setPlayerName: (name: string) => void;
  setText: (text: string) => void;
  startCountdown: () => void;
  tickCountdown: () => void;
  startRace: () => void;
  handleInput: (char: string) => void;
  handleBackspace: () => void;
  finishRace: () => void;
  reset: () => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  text: "",
  input: "",
  status: "idle",
  startTime: null,
  endTime: null,
  countdown: 3,
  errors: 0,
  wpm: 0,
  accuracy: 100,
  playerName: "",
  language: "id",

  setLanguage: (lang) => set({ language: lang }),
  setPlayerName: (name) => set({ playerName: name }),
  setText: (text) => set({ text, input: "", status: "idle", errors: 0, wpm: 0, accuracy: 100, startTime: null, endTime: null }),
  
  startCountdown: () => set({ status: "countdown", countdown: 3 }),
  
  tickCountdown: () => set((state) => ({ countdown: Math.max(0, state.countdown - 1) })),
  
  startRace: () => set({ status: "running", startTime: Date.now() }),

  handleInput: (char) => {
    const { status, input, text, errors, startTime } = get();
    if (status !== "running") return;

    const expectedChar = text[input.length];
    const newErrors = char !== expectedChar ? errors + 1 : errors;
    const newInput = input + char;

    let newStatus: RaceStatus = status;
    let endTime = null;
    let wpm = get().wpm;
    let accuracy = get().accuracy;

    if (newInput.length === text.length) {
      newStatus = "finished";
      endTime = Date.now();
      
      const timeMs = endTime - (startTime || endTime);
      const minutes = timeMs / 60000;
      const correctChars = text.length - newErrors;
      wpm = Math.round((correctChars / 5) / minutes);
      accuracy = Math.round((correctChars / text.length) * 100 * 10) / 10; // 1 decimal place
    } else if (startTime) {
      const timeMs = Date.now() - startTime;
      const minutes = timeMs / 60000;
      if (minutes > 0) {
        const correctChars = newInput.length - newErrors;
        wpm = Math.max(0, Math.round((correctChars / 5) / minutes));
        accuracy = Math.max(0, Math.round((correctChars / newInput.length) * 100 * 10) / 10);
      }
    }

    set({ 
      input: newInput, 
      errors: newErrors,
      status: newStatus,
      endTime,
      wpm,
      accuracy
    });
  },

  handleBackspace: () => {
    const { status, input } = get();
    if (status !== "running" || input.length === 0) return;
    set({ input: input.slice(0, -1) });
  },

  finishRace: () => set({ status: "finished", endTime: Date.now() }),

  reset: () => set({
    input: "",
    status: "idle",
    startTime: null,
    endTime: null,
    countdown: 3,
    errors: 0,
    wpm: 0,
    accuracy: 100
  })
}));
