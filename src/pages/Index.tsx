import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const cta = user ? "/showroom" : "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 lg:px-12 py-6 flex items-center justify-between">
        <span className="font-display text-xl tracking-[0.4em]">ATELIER</span>
        <nav className="hidden md:flex items-center gap-10 font-mono-ed text-xs tracking-[0.3em]">
          <a href="#showroom" className="hover:text-accent-foreground hover:bg-accent px-2 py-1 transition-colors">SHOWROOM</a>
          <a href="#how" className="hover:text-accent-foreground hover:bg-accent px-2 py-1 transition-colors">HOW IT WORKS</a>
          <a href="#brands" className="hover:text-accent-foreground hover:bg-accent px-2 py-1 transition-colors">BRANDS</a>
        </nav>
        <Link to={cta}>
          <Button className="rounded-none h-10 font-mono-ed text-xs tracking-[0.3em]">
            {user ? "ENTER →" : "BEGIN →"}
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 lg:px-12 pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-spotlight pointer-events-none" />
        <div className="relative z-10 max-w-6xl">
          <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-8 animate-fade-up">
            FW/26 — VIRTUAL SHOWROOM
          </p>
          <h1 className="font-display text-[clamp(3rem,11vw,11rem)] leading-[0.9] mb-8 animate-fade-up">
            Walk the<br />
            <span className="italic">runway</span>.<br />
            Try the <span className="bg-accent px-3 inline-block">look</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Build your avatar in seconds. Step into a 3D showroom. Browse collections from the boldest names in fashion — fitted to your body.
          </p>
          <div className="flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link to={cta}>
              <Button className="rounded-none h-14 px-10 font-mono-ed text-xs tracking-[0.3em]">
                {user ? "RETURN TO SHOWROOM →" : "CREATE YOUR AVATAR →"}
              </Button>
            </Link>
            <a href="#how" className="font-mono-ed text-xs tracking-[0.3em] underline underline-offset-8 hover:text-muted-foreground transition-colors">
              HOW IT WORKS
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden lg:block font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
          ↓ SCROLL
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 lg:px-12 py-32 border-t border-foreground/10">
        <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-6">— PROCESS</p>
        <h2 className="font-display text-5xl md:text-7xl mb-20 max-w-4xl">Three steps. One fitting.</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { n: "01", t: "Configure your avatar", d: "Tell us your gender, height, weight. Refine shoulders, waist, hips with sliders. We generate a parametric 3D model." },
            { n: "02", t: "Walk the showroom", d: "Navigate a minimal 3D space. Each brand owns a plinth. Click to step into their collection." },
            { n: "03", t: "Try it on", d: "Pieces drape onto your avatar, scaled to your frame. Save outfits, share looks, check out — in-app or with the brand." },
          ].map((s) => (
            <div key={s.n} className="border-t border-foreground pt-6">
              <p className="font-mono-ed text-xs tracking-[0.3em] mb-6">{s.n}</p>
              <h3 className="font-display text-3xl mb-4">{s.t}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brands strip */}
      <section id="brands" className="px-6 lg:px-12 py-24 border-t border-foreground/10 bg-foreground text-background">
        <p className="font-mono-ed text-xs tracking-[0.3em] text-background/60 mb-6">— LAUNCH PARTNERS</p>
        <div className="flex flex-wrap gap-x-16 gap-y-6 font-display text-3xl md:text-5xl tracking-tight">
          <span>MAISON NOIR</span>
          <span className="italic text-accent">LUMEN</span>
          <span>VOID/STUDIO</span>
          <span className="text-background/40">+ MORE SOON</span>
        </div>
      </section>

      {/* CTA */}
      <section id="showroom" className="px-6 lg:px-12 py-32 text-center border-t border-foreground/10">
        <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-6">— READY?</p>
        <h2 className="font-display text-5xl md:text-8xl leading-none mb-10">
          Your fitting room<br />
          is <span className="italic">waiting</span>.
        </h2>
        <Link to={cta}>
          <Button className="rounded-none h-14 px-12 font-mono-ed text-xs tracking-[0.3em]">
            {user ? "ENTER SHOWROOM →" : "BEGIN →"}
          </Button>
        </Link>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-foreground/10 flex items-center justify-between font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
        <span>© ATELIER MMXXV</span>
        <span>BUILT FOR THE NEXT WAY TO SHOP</span>
      </footer>
    </div>
  );
};

export default Index;
