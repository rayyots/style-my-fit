import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "@/hooks/useUserContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ALL_SIZES } from "@/lib/sizing";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Admin = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useUserContext();
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tab, setTab] = useState<"brands" | "products">("brands");

  // Brand form
  const [bName, setBName] = useState("");
  const [bTagline, setBTagline] = useState("");
  const [bDescription, setBDescription] = useState("");

  // Product form
  const [pBrand, setPBrand] = useState("");
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pDescription, setPDescription] = useState("");
  const [pGender, setPGender] = useState<"male"|"female"|"unisex">("unisex");
  const [pSizes, setPSizes] = useState<string[]>(["S", "M", "L"]);
  const [pPrice, setPPrice] = useState("0");
  const [pCurrency, setPCurrency] = useState("USD");
  const [pFiles, setPFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from("brands").select("*").order("name"),
      supabase.from("products").select("*,brand:brands(name)").order("created_at", { ascending: false }),
    ]);
    setBrands(b ?? []); setProducts(p ?? []);
  };

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { nav("/showroom"); return; }
    reload();
  }, [isAdmin, loading]);

  const createBrand = async () => {
    if (!bName) return;
    const slug = slugify(bName);
    const { error } = await supabase.from("brands").insert({ name: bName, slug, tagline: bTagline || null, description: bDescription || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Brand created");
    setBName(""); setBTagline(""); setBDescription("");
    reload();
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("Delete brand and all its products?")) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };

  const createProduct = async () => {
    if (!pBrand || !pName || !pCategory) { toast.error("Fill brand / name / category"); return; }
    setBusy(true);
    try {
      const imageUrls: string[] = [];
      if (pFiles && user) {
        for (const f of Array.from(pFiles)) {
          const path = `${user.id}/${Date.now()}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
          const { error: upErr } = await supabase.storage.from("products").upload(path, f);
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
          imageUrls.push(pub.publicUrl);
        }
      }
      const { error } = await supabase.from("products").insert({
        brand_id: pBrand, name: pName, category: pCategory,
        description: pDescription || null, gender: pGender, sizes: pSizes,
        images: imageUrls, price_cents: Math.round(parseFloat(pPrice || "0") * 100),
        currency: pCurrency,
      });
      if (error) throw error;
      toast.success("Product added");
      setPName(""); setPCategory(""); setPDescription(""); setPFiles(null);
      reload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="font-mono-ed text-xs tracking-[0.3em]">…</span></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/showroom" className="font-mono-ed text-xs tracking-[0.3em] hover:bg-accent px-2 py-1">← SHOWROOM</Link>
        <span className="font-display text-xl tracking-[0.4em]">ADMIN</span>
        <span className="w-16" />
      </header>

      <div className="px-6 lg:px-12 py-6 border-b border-foreground/10 flex gap-4">
        {(["brands","products"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 h-10 border text-xs uppercase tracking-widest ${tab===t?"bg-foreground text-background border-foreground":"border-foreground/20"}`}>
            {t}
          </button>
        ))}
      </div>

      <main className="max-w-6xl mx-auto p-6 lg:p-12 grid lg:grid-cols-2 gap-12">
        {tab === "brands" && (
          <>
            <section className="space-y-4">
              <h2 className="font-display text-2xl">New brand</h2>
              <Field label="Name" v={bName} set={setBName} />
              <Field label="Tagline" v={bTagline} set={setBTagline} />
              <div>
                <Label className="text-[10px] uppercase tracking-widest">Description</Label>
                <Textarea value={bDescription} onChange={(e) => setBDescription(e.target.value)} className="mt-1 rounded-none" rows={4} />
              </div>
              <Button onClick={createBrand} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">CREATE BRAND</Button>
            </section>
            <section className="space-y-3">
              <h2 className="font-display text-2xl">Brands ({brands.length})</h2>
              {brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between border border-foreground/10 p-3">
                  <div>
                    <p className="font-display text-lg">{b.name}</p>
                    <p className="font-mono-ed text-[10px] text-muted-foreground">/{b.slug}</p>
                  </div>
                  <button onClick={() => deleteBrand(b.id)} className="font-mono-ed text-[10px] text-destructive hover:underline">DELETE</button>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "products" && (
          <>
            <section className="space-y-4">
              <h2 className="font-display text-2xl">New product</h2>
              <div>
                <Label className="text-[10px] uppercase tracking-widest">Brand</Label>
                <select value={pBrand} onChange={(e) => setPBrand(e.target.value)} className="mt-1 w-full h-10 border border-foreground/20 bg-transparent px-3 rounded-none">
                  <option value="">— select —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <Field label="Name" v={pName} set={setPName} />
              <Field label="Category" v={pCategory} set={setPCategory} placeholder="Outerwear, Tops…" />
              <div>
                <Label className="text-[10px] uppercase tracking-widest">Description</Label>
                <Textarea value={pDescription} onChange={(e) => setPDescription(e.target.value)} className="mt-1 rounded-none" rows={3} />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest mb-2 block">Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["female","male","unisex"] as const).map((g) => (
                    <button key={g} onClick={() => setPGender(g)} className={`h-10 border text-[11px] uppercase tracking-widest ${pGender===g?"bg-foreground text-background border-foreground":"border-foreground/20"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest mb-2 block">Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => (
                    <button key={s} onClick={() => setPSizes((c) => c.includes(s) ? c.filter((x) => x !== s) : [...c, s])}
                      className={`w-10 h-9 border text-[11px] ${pSizes.includes(s)?"bg-foreground text-background border-foreground":"border-foreground/20"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price" v={pPrice} set={setPPrice} placeholder="49.00" />
                <Field label="Currency" v={pCurrency} set={setPCurrency} />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest">Images</Label>
                <input type="file" multiple accept="image/*" onChange={(e) => setPFiles(e.target.files)} className="mt-2 block w-full text-xs" />
              </div>
              <Button onClick={createProduct} disabled={busy} className="rounded-none font-mono-ed text-xs tracking-[0.3em]">{busy ? "UPLOADING…" : "CREATE PRODUCT"}</Button>
            </section>
            <section className="space-y-3">
              <h2 className="font-display text-2xl">Products ({products.length})</h2>
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border border-foreground/10 p-3">
                  <div className="w-12 h-16 bg-secondary shrink-0">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base truncate">{p.name}</p>
                    <p className="font-mono-ed text-[10px] text-muted-foreground">{p.brand?.name} · {p.category}</p>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="font-mono-ed text-[10px] text-destructive hover:underline">DELETE</button>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const Field = ({ label, v, set, placeholder }: { label: string; v: string; set: (s: string) => void; placeholder?: string }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest">{label}</Label>
    <Input value={v} onChange={(e) => set(e.target.value)} placeholder={placeholder} className="mt-1 rounded-none" />
  </div>
);

export default Admin;
