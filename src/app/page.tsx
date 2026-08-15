"use client";
import Link from "next/link";
import { useTypingStore } from "@/lib/typing/store";

export default function Home() {
  const { language, setLanguage } = useTypingStore();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm flex flex-col text-center">
        <div className="mb-6 font-semibold text-primary uppercase tracking-widest text-xs md:text-sm bg-primary/10 px-6 py-2 rounded-full border border-primary/20 shadow-sm">
          Typing Master
        </div>
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-primary drop-shadow-sm">TYPE RACE</h1>
      </div>
      
      <div className="mt-12 text-center z-10 max-w-2xl">
        <p className="text-3xl font-semibold mb-6">Seberapa cepat kamu bisa mengetik?</p>
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          Uji kecepatan ketikmu. Lawan teman-temanmu. Jadilah yang tercepat di sini!
        </p>

        <div className="mb-10 flex justify-center gap-4 flex-wrap">
          <button 
            onClick={() => setLanguage("id")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${language === 'id' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            🇮🇩 Indonesia
          </button>
          <button 
            onClick={() => setLanguage("en")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${language === 'en' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            🇬🇧 English
          </button>
          <button 
            onClick={() => setLanguage("ar")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${language === 'ar' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            🇸🇦 Arab
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link 
            href="/race" 
            className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-transform hover:scale-105 shadow-lg shadow-primary/25 text-lg"
          >
            Start Typing
          </Link>
          <Link 
            href="/battle"
            className="px-8 py-4 bg-secondary text-secondary-foreground font-bold rounded-full hover:bg-secondary/80 transition-transform hover:scale-105 shadow border text-lg"
          >
            Battle Friends
          </Link>
        </div>
        
        <div className="mt-16 flex justify-center gap-8 text-sm font-medium text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <span className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl">👤</span>
            Solo Race
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl">⚔️</span>
            Battle 2-10 Players
          </div>
          <Link href="/hall-of-fame" className="flex flex-col items-center gap-2 hover:text-primary transition-colors cursor-pointer group">
            <span className="w-12 h-12 bg-muted group-hover:bg-primary/20 rounded-full flex items-center justify-center text-xl transition-colors">🏆</span>
            Hall of Fame
          </Link>
        </div>
      </div>
    </main>
  );
}
