import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Save, Shirt, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  OUTFIT_TABS,
  OutfitTab,
  TAB_LABELS,
  STYLE_VIBES,
  VibeId,
  OutfitItem,
  categoryToTab,
  saveOutfit,
} from "@/lib/outfits";
import { Button } from "@/components/ui/button";

interface ProductRow {
  id: string;
  name: string;
  category: string;
  brand_id: string;
  images: string[];
  price_cents: number;
  currency: string;
  brands?: { name: string } | null;
}

interface Props {
  /** Current selection per tab (one product per slot). */
  selection: Partial<Record<OutfitTab, OutfitItem>>;
  onSelectionChange: (next: Partial<Record<OutfitTab, OutfitItem>>) => void;
  /** Avatar snapshot saved alongside the outfit. */
  avatarSnapshot: any;
  /** Pre-selected vibe (from profile). */
  defaultVibe?: VibeId | null;
}

/**
 * Outfit builder side panel (desktop) and bottom drawer (mobile via vaul).
 * Tabs by category; clicking an item assigns it to that slot.
 * Includes AI Suggest (vibe + free-text prompt) and Save Outfit.
 */
export const OutfitBuilder = ({ selection, onSelectionChange, avatarSnapshot, defaultVibe }: Props) => {
  return (
    <>
      {/* Desktop side panel */}
      <div className="hidden lg:block h-full overflow-y-auto border-l border-foreground/10 bg-background">
        <BuilderBody
          selection={selection}
          onSelectionChange={onSelectionChange}
          avatarSnapshot={avatarSnapshot}
          defaultVibe={defaultVibe}
        />
      </div>

      {/* Mobile bottom drawer */}
      <MobileDrawer
        selection={selection}
        onSelectionChange={onSelectionChange}
        avatarSnapshot={avatarSnapshot}
        defaultVibe={defaultVibe}
      />
    </>
  );
};

const MobileDrawer = (props: Props) => {
  const [open, setOpen] = useState(false);
  const count = Object.values(props.selection).filter(Boolean).length;
  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <button
          aria-label="Open outfit builder"
          className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-4 h-11 bg-gradient-gold text-gold-foreground border border-gold shadow-lg font-mono-ed text-[10px] tracking-[0.3em] rounded-none"
        >
          <Shirt size={14} />
          STYLE · {count}/5
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 inset-x-0 z-50 max-h-[88vh] bg-background border-t border-gold/40 flex flex-col rounded-t-2xl outline-none">
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-foreground/20" />
          <div className="flex items-center justify-between px-4 pt-1 pb-2">
            <p className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">OUTFIT BUILDER</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="grid place-items-center w-8 h-8 hover:text-gold">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BuilderBody {...props} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const BuilderBody = ({ selection, onSelectionChange, avatarSnapshot, defaultVibe }: Props) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<OutfitTab>("top");
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [vibe, setVibe] = useState<VibeId | "">((defaultVibe ?? "") as any);
  const [vibePrompt, setVibePrompt] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outfitName, setOutfitName] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,category,brand_id,images,price_cents,currency,brands(name)")
        .order("created_at", { ascending: false })
        .limit(500);
      setProducts((data ?? []) as any);
    })();
  }, []);

  const byTab = useMemo(() => {
    const map: Record<OutfitTab, ProductRow[]> = { top: [], bottom: [], shoes: [], accessory: [], jacket: [] };
    (products ?? []).forEach((p) => map[categoryToTab(p.category)].push(p));
    return map;
  }, [products]);

  const pick = (p: ProductRow) => {
    const t = categoryToTab(p.category);
    const item: OutfitItem = {
      product_id: p.id,
      name: p.name,
      category: p.category,
      brand_id: p.brand_id,
      brand_name: p.brands?.name,
      image: p.images?.[0] ?? null,
      price_cents: p.price_cents,
      currency: p.currency,
    };
    onSelectionChange({ ...selection, [t]: item });
    setTab(t);
  };

  const clearSlot = (t: OutfitTab) => {
    const next = { ...selection };
    delete next[t];
    onSelectionChange(next);
  };

  const handleSuggest = async () => {
    if (!vibe && !vibePrompt.trim()) {
      toast.info("Pick a vibe or describe one");
      return;
    }
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-outfit", {
        body: {
          vibe: vibe || null,
          prompt: vibePrompt.trim() || null,
        },
      });
      if (error) throw error;
      const picked: { product_id: string; tab: OutfitTab }[] = data?.picks ?? [];
      if (!picked.length) {
        toast.error("AI couldn't find a match. Try a different vibe.");
        return;
      }
      const next: Partial<Record<OutfitTab, OutfitItem>> = {};
      picked.forEach(({ product_id }) => {
        const p = (products ?? []).find((x) => x.id === product_id);
        if (!p) return;
        const t = categoryToTab(p.category);
        next[t] = {
          product_id: p.id,
          name: p.name,
          category: p.category,
          brand_id: p.brand_id,
          brand_name: p.brands?.name,
          image: p.images?.[0] ?? null,
          price_cents: p.price_cents,
          currency: p.currency,
        };
      });
      onSelectionChange(next);
      toast.success(data?.note ?? "Outfit suggested");
    } catch (e: any) {
      toast.error(e?.message ?? "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Sign in to save looks");
      return;
    }
    const items = Object.values(selection).filter(Boolean) as OutfitItem[];
    if (!items.length) {
      toast.info("Pick at least one item");
      return;
    }
    setSaving(true);
    try {
      await saveOutfit(user.id, {
        name: outfitName.trim() || `Look · ${new Date().toLocaleDateString()}`,
        items,
        avatar_config: avatarSnapshot,
        style_vibe: vibe || null,
      });
      toast.success("Look saved to your wardrobe");
      setOutfitName("");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* AI Suggest */}
      <div className="border border-gold/30 p-4 bg-secondary/30 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold" />
          <p className="font-mono-ed text-[10px] tracking-[0.3em] text-gold">AI · SUGGEST OUTFIT</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {STYLE_VIBES.map((v) => (
            <button
              key={v.id}
              onClick={() => setVibe(vibe === v.id ? "" : v.id)}
              className={`h-12 border text-[10px] tracking-[0.15em] uppercase flex flex-col items-center justify-center gap-0.5 transition-colors ${
                vibe === v.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 hover:border-gold"
              }`}
            >
              <span className="text-base leading-none">{v.emoji}</span>
              <span className="text-[8px]">{v.label}</span>
            </button>
          ))}
        </div>
        <input
          value={vibePrompt}
          onChange={(e) => setVibePrompt(e.target.value)}
          placeholder='e.g. "beach date in Dubai"'
          className="w-full h-10 px-3 bg-background border border-foreground/20 text-sm focus:border-gold outline-none placeholder:text-muted-foreground/60"
        />
        <Button
          onClick={handleSuggest}
          disabled={suggesting}
          className="w-full h-10 rounded-none bg-gradient-gold text-gold-foreground hover:opacity-90 font-mono-ed text-[10px] tracking-[0.3em]"
        >
          {suggesting ? <Loader2 className="animate-spin" size={14} /> : "GENERATE LOOK"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-foreground/10 overflow-x-auto no-scrollbar">
        {OUTFIT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 h-10 font-mono-ed text-[10px] tracking-[0.25em] uppercase whitespace-nowrap border-b-2 transition-colors ${
              tab === t
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[t]}
            {selection[t] && <span className="ml-1 text-gold">●</span>}
          </button>
        ))}
      </div>

      {/* Selected slot */}
      {selection[tab] && (
        <div className="flex items-center gap-3 border border-gold/40 p-2 bg-gold/5">
          {selection[tab]!.image && (
            <img src={selection[tab]!.image!} alt="" className="w-12 h-12 object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selection[tab]!.name}</p>
            <p className="font-mono-ed text-[9px] tracking-widest text-muted-foreground uppercase truncate">
              {selection[tab]!.brand_name}
            </p>
          </div>
          <button
            onClick={() => clearSlot(tab)}
            aria-label="Remove"
            className="grid place-items-center w-7 h-7 hover:text-destructive"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {(byTab[tab] ?? []).map((p) => {
            const active = selection[tab]?.product_id === p.id;
            return (
              <motion.button
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => pick(p)}
                className={`text-left border bg-card hover:shadow-soft transition-all ${
                  active ? "border-gold ring-2 ring-gold/30" : "border-foreground/10 hover:border-gold/60"
                }`}
              >
                <div className="aspect-square bg-secondary/40 overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Shirt size={20} />
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-0.5">
                  <p className="text-[11px] font-medium leading-tight line-clamp-2">{p.name}</p>
                  <p className="font-mono-ed text-[9px] tracking-widest text-muted-foreground uppercase truncate">
                    {p.brands?.name}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {products && (byTab[tab] ?? []).length === 0 && (
          <p className="col-span-2 text-center text-xs text-muted-foreground py-8">
            No {TAB_LABELS[tab].toLowerCase()} yet.
          </p>
        )}
        {!products &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-foreground/10 bg-card">
              <div className="aspect-square bg-secondary/40 animate-pulse" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-secondary/60 animate-pulse rounded-sm" />
                <div className="h-2 w-2/3 bg-secondary/40 animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
      </div>

      {/* Save outfit */}
      <div className="border-t border-gold/30 pt-4 space-y-2">
        <input
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          placeholder="Name this look (optional)"
          className="w-full h-10 px-3 bg-background border border-foreground/20 text-sm focus:border-gold outline-none"
        />
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="outline"
          className="w-full h-10 rounded-none border-foreground hover:bg-foreground hover:text-background font-mono-ed text-[10px] tracking-[0.3em]"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : (<><Save size={13} className="mr-2" /> SAVE LOOK</>)}
        </Button>
      </div>
    </div>
  );
};