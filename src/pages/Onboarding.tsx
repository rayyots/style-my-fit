import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { AvatarConfig, defaultAvatar, deriveFromMeasurements, fetchAvatar, upsertAvatar } from "@/lib/avatar";
import { AvatarPreview } from "@/components/AvatarPreview";

type Step = 0 | 1 | 2;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "nonbinary">("female");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [cfg, setCfg] = useState<AvatarConfig>(defaultAvatar);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data?.name) setName(data.name);
      if (data?.gender) setGender(data.gender as any);
      if (data?.height_cm) setHeight(Number(data.height_cm));
      if (data?.weight_kg) setWeight(Number(data.weight_kg));
      const av = await fetchAvatar(user.id);
      if (av) {
        setCfg(av);
        // If they've already onboarded, jump straight to showroom
        navigate("/showroom");
      }
    })();
  }, [user, loading, navigate]);

  const proceedFromMeasurements = () => {
    setCfg(deriveFromMeasurements(height, weight, gender));
    setStep(2);
  };

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error: pErr } = await supabase.from("profiles").update({
        name, gender, height_cm: height, weight_kg: weight,
      }).eq("id", user.id);
      if (pErr) throw pErr;
      await upsertAvatar(user.id, cfg);
      toast.success("Your avatar is ready.");
      navigate("/showroom");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-5 flex items-center justify-between">
        <span className="font-display text-xl tracking-[0.4em]">ATELIER</span>
        <span className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground">
          STEP {String(step + 1).padStart(2, "0")} / 03
        </span>
      </header>

      <div className="grid lg:grid-cols-[1fr_1.1fr] min-h-[calc(100vh-65px)]">
        {/* Left: form */}
        <section className="p-8 lg:p-16 flex flex-col justify-center max-w-2xl animate-fade-up">
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-3">YOU</p>
                <h1 className="font-display text-5xl leading-tight">What should we call you?</h1>
              </div>
              <div>
                <Label htmlFor="n" className="text-xs uppercase tracking-widest">Name</Label>
                <Input id="n" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 rounded-none border-0 border-b border-foreground/20 bg-transparent px-0 text-2xl h-14 focus-visible:ring-0" placeholder="Iris" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest mb-3 block">Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["female", "male", "nonbinary"] as const).map((g) => (
                    <button key={g} type="button" onClick={() => setGender(g)}
                      className={`h-12 border text-xs uppercase tracking-widest transition-all duration-300 ease-silk ${gender === g ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground"}`}>
                      {g === "nonbinary" ? "Non-binary" : g}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => setStep(1)} disabled={!name} className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]">
                CONTINUE →
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div>
                <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-3">MEASUREMENTS</p>
                <h1 className="font-display text-5xl leading-tight">Your dimensions.</h1>
                <p className="text-sm text-muted-foreground mt-3 max-w-md">
                  We'll use these to size your avatar and filter clothing for you.
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <Label className="text-xs uppercase tracking-widest">Height</Label>
                    <span className="font-mono-ed text-sm">{height} cm</span>
                  </div>
                  <Slider value={[height]} onValueChange={([v]) => setHeight(v)} min={140} max={210} step={1} />
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <Label className="text-xs uppercase tracking-widest">Weight</Label>
                    <span className="font-mono-ed text-sm">{weight} kg</span>
                  </div>
                  <Slider value={[weight]} onValueChange={([v]) => setWeight(v)} min={40} max={150} step={1} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]">← BACK</Button>
                <Button onClick={proceedFromMeasurements} className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]">
                  GENERATE AVATAR →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-3">REFINE</p>
                <h1 className="font-display text-5xl leading-tight">Make it yours.</h1>
              </div>
              <div className="space-y-5">
                {[
                  { k: "shoulders", label: "Shoulders" },
                  { k: "waist", label: "Waist" },
                  { k: "hips", label: "Hips" },
                  { k: "torso", label: "Torso length" },
                  { k: "legs", label: "Leg length" },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="flex justify-between mb-2">
                      <Label className="text-xs uppercase tracking-widest">{s.label}</Label>
                      <span className="font-mono-ed text-xs text-muted-foreground">{(cfg as any)[s.k].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(cfg as any)[s.k]]}
                      onValueChange={([v]) => setCfg({ ...cfg, [s.k]: v } as AvatarConfig)}
                      min={0.7} max={1.4} step={0.01}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-widest mb-2 block">Skin</Label>
                    <input type="color" value={cfg.skin_tone} onChange={(e) => setCfg({ ...cfg, skin_tone: e.target.value })} className="h-10 w-full border border-foreground/20 cursor-pointer bg-transparent" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest mb-2 block">Hair</Label>
                    <input type="color" value={cfg.hair_color} onChange={(e) => setCfg({ ...cfg, hair_color: e.target.value })} className="h-10 w-full border border-foreground/20 cursor-pointer bg-transparent" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-none h-12 font-mono-ed text-xs tracking-[0.3em]">← BACK</Button>
                <Button onClick={finish} disabled={busy} className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]">
                  {busy ? "…" : "ENTER SHOWROOM →"}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Right: 3D preview */}
        <section className="bg-secondary/40 border-l border-foreground/10 relative">
          <AvatarPreview cfg={cfg} />
          <div className="absolute top-4 left-4 font-mono-ed text-[10px] tracking-[0.3em] text-muted-foreground">
            LIVE PREVIEW · ROTATE WITH MOUSE
          </div>
        </section>
      </div>
    </div>
  );
};

export default Onboarding;
