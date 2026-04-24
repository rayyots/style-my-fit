import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const { user } = useAuth();
  const cta = user ? "/showroom" : "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 lg:px-12 py-5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-10 font-mono-ed text-[11px] tracking-[0.3em]">
          <a href="#how" className="hover:text-gold transition-colors">HOW IT WORKS</a>
          <a href="#brands" className="hover:text-gold transition-colors">BRANDS</a>
          <a href="#showroom" className="hover:text-gold transition-colors">SHOWROOM</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to={cta}>
            <Button className="rounded-none h-10 font-mono-ed text-[11px] tracking-[0.3em] bg-gradient-gold text-gold-foreground hover:opacity-90 border-0">
              {user ? "ENTER →" : "BEGIN →"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-12 pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-spotlight pointer-events-none" />
        <div className="relative z-10 max-w-6xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-mono-ed text-[11px] tracking-[0.4em] text-gold mb-8"
          >
            FW/26 — VIRTUAL SHOWROOM
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-display text-[clamp(3rem,12vw,12rem)] leading-[0.9] mb-8 tracking-tight"
          >
            Walk the<br />
            <span className="italic">runway</span>.<br />
            Try the <span className="bg-gradient-gold text-gold-foreground px-3 inline-block">look</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10"
          >
            Build your avatar. Step into a 3D showroom. Browse 15 houses' collections — fitted to your body, draped over your form.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link to={cta}>
              <Button className="rounded-none h-14 px-10 font-mono-ed text-[11px] tracking-[0.3em] bg-gradient-gold text-gold-foreground hover:opacity-90 border-0 shadow-luxe">
                {user ? "RETURN TO SHOWROOM →" : "CREATE YOUR AVATAR →"}
              </Button>
            </Link>
            <a href="#how" className="font-mono-ed text-[11px] tracking-[0.3em] underline underline-offset-8 hover:text-gold transition-colors">
              HOW IT WORKS
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-8 right-8 hidden lg:block font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
          ↓ SCROLL
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 sm:px-6 lg:px-12 py-32 border-t border-gold/20">
        <p className="font-mono-ed text-[11px] tracking-[0.3em] text-gold mb-6">— PROCESS</p>
        <h2 className="font-display text-5xl md:text-7xl mb-20 max-w-4xl">Three steps. One fitting.</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { n: "01", t: "Configure your avatar", d: "Tell us your gender, height, weight. Refine shoulders, waist, hips with sliders. We sculpt a 3D model in your image." },
            { n: "02", t: "Walk the showroom", d: "Step into a circular gallery of 15 houses. Each plinth waits for you. Click to enter the collection." },
            { n: "03", t: "Try it on", d: "Pieces wrap onto your form. Tops on torso, jackets layered, bottoms on legs, dresses head-to-toe. Add to cart, check out." },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="border-t border-gold/40 pt-6"
            >
              <p className="font-mono-ed text-[11px] tracking-[0.3em] mb-6 text-gold">{s.n}</p>
              <h3 className="font-display text-3xl mb-4">{s.t}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Brands marquee */}
      <section id="brands" className="overflow-hidden border-t border-gold/20 bg-foreground text-background py-16">
        <p className="font-mono-ed text-[11px] tracking-[0.3em] text-gold mb-6 px-4 sm:px-6 lg:px-12">— FIFTEEN HOUSES</p>
        <div className="flex animate-marquee whitespace-nowrap font-display text-4xl md:text-6xl tracking-tight">
          {[...Array(2)].map((_, repeat) => (
            <div key={repeat} className="flex shrink-0">
              {["MAISON NOIR", "LUMEN", "VOID/STUDIO", "ASHEN&CO", "CIEL", "OBSIDIAN", "FUMÉE", "RIVAGE", "KORE", "MOIRÉ", "TENEBRA", "AURORA", "SIERRA", "BRUTAL", "ÉCRU"].map((n) => (
                <span key={n + repeat} className="px-8">
                  <span className={n.length % 2 === 0 ? "italic text-gold" : ""}>{n}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="showroom" className="px-4 sm:px-6 lg:px-12 py-32 text-center border-t border-gold/20">
        <p className="font-mono-ed text-[11px] tracking-[0.3em] text-gold mb-6">— READY?</p>
        <h2 className="font-display text-5xl md:text-8xl leading-none mb-10">
          Your fitting room<br />
          is <span className="italic">waiting</span>.
        </h2>
        <Link to={cta}>
          <Button className="rounded-none h-14 px-12 font-mono-ed text-[11px] tracking-[0.3em] bg-gradient-gold text-gold-foreground hover:opacity-90 border-0 shadow-luxe">
            {user ? "ENTER SHOWROOM →" : "BEGIN →"}
          </Button>
        </Link>
      </section>

      <footer className="px-4 sm:px-6 lg:px-12 py-8 border-t border-gold/20 flex items-center justify-between font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
        <span>© KO MMXXVI</span>
        <span className="hidden sm:inline">CRAFTED FOR THE NEXT WAY TO SHOP</span>
      </footer>
    </div>
  );
};

export default Index;
