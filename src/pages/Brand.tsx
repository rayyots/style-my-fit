import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Brand = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-foreground/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/showroom")} className="font-mono-ed text-xs tracking-[0.3em] hover:text-accent-foreground hover:bg-accent px-2 py-1">
          ← SHOWROOM
        </button>
        <span className="font-display text-xl tracking-[0.4em]">ATELIER</span>
        <span className="w-24" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="font-mono-ed text-xs tracking-[0.3em] text-muted-foreground mb-6">BRAND · {id?.toUpperCase()}</p>
        <h1 className="font-display text-6xl mb-6">Collection coming next.</h1>
        <p className="max-w-md text-muted-foreground mb-10">
          The product catalog, smart filtering, and try-on flow are the next milestone. The 3D showroom and avatar foundation are now ready.
        </p>
        <Button onClick={() => navigate("/showroom")} className="rounded-none h-12 px-10 font-mono-ed text-xs tracking-[0.3em]">
          BACK TO SHOWROOM
        </Button>
      </main>
    </div>
  );
};

export default Brand;
