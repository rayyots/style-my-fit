import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "At least 6 characters" }).max(72),
  name: z.string().trim().max(80).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/onboarding");
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, name });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Atelier.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-spotlight opacity-60" />
        <Link to="/" className="font-display text-2xl tracking-[0.4em] relative z-10">
          ATELIER
        </Link>
        <div className="relative z-10">
          <p className="font-display text-5xl leading-[1.05] mb-6 animate-fade-up">
            Walk the runway.<br />
            <span className="italic text-accent">Try the look.</span>
          </p>
          <p className="text-sm text-background/70 max-w-sm">
            A 3D showroom built around your body. Your avatar. Your fit.
          </p>
        </div>
        <p className="font-mono-ed text-xs text-background/40 relative z-10">© ATELIER MMXXV</p>
      </aside>

      <main className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div>
            <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-2">
              {mode === "signup" ? "01 — CREATE ACCOUNT" : "01 — RETURN"}
            </p>
            <h1 className="font-display text-4xl">{mode === "signup" ? "Begin." : "Welcome back."}</h1>
          </div>

          {mode === "signup" && (
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-widest">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 rounded-none border-0 border-b border-foreground/20 bg-transparent px-0 focus-visible:ring-0" placeholder="Iris Vasquez" />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-widest">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 rounded-none border-0 border-b border-foreground/20 bg-transparent px-0 focus-visible:ring-0" placeholder="you@studio.com" required />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs uppercase tracking-widest">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 rounded-none border-0 border-b border-foreground/20 bg-transparent px-0 focus-visible:ring-0" placeholder="••••••••" required />
          </div>

          <Button type="submit" disabled={busy} className="w-full rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]">
            {busy ? "…" : mode === "signup" ? "CREATE ACCOUNT" : "ENTER"}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          >
            {mode === "signup" ? "Already have an account? Sign in →" : "New here? Create an account →"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Auth;
