import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProductMini {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  brand_name: string | null;
}

function categoryToTab(category: string): "top" | "bottom" | "shoes" | "accessory" | "jacket" {
  const c = (category || "").toLowerCase();
  if (/(jacket|coat|blazer|outerwear|parka|trench)/.test(c)) return "jacket";
  if (/(pant|trouser|jean|short|skirt|bottom|legging|dress|gown|jumpsuit)/.test(c)) return "bottom";
  if (/(shoe|sneaker|boot|heel|loafer|sandal)/.test(c)) return "shoes";
  if (/(hat|cap|beanie|bag|scarf|belt|accessor|jewel|sunglass|watch)/.test(c)) return "accessory";
  return "top";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const { vibe, prompt } = await req.json().catch(() => ({}));
    if (!vibe && !prompt) {
      return new Response(JSON.stringify({ error: "Provide a vibe or a prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pull catalog (capped) to ground the model.
    const { data: rows, error } = await supabase
      .from("products")
      .select("id,name,category,price_cents,brands(name)")
      .limit(200);
    if (error) throw error;

    const products: ProductMini[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price_cents: r.price_cents,
      brand_name: r.brands?.name ?? null,
    }));

    // Group catalog by tab so the model can pick one per slot.
    const grouped: Record<string, ProductMini[]> = { top: [], bottom: [], shoes: [], accessory: [], jacket: [] };
    products.forEach((p) => grouped[categoryToTab(p.category)].push(p));

    const validIds = new Set(products.map((p) => p.id));

    const systemPrompt =
      "You are a senior fashion stylist for KO, a luxury label. Build cohesive outfits using ONLY the catalog provided. " +
      "Pick at most one product per slot (top, bottom, shoes, accessory, jacket). Skip slots if no item fits the brief. " +
      "Prioritize coherence with the requested vibe and free-text prompt.";

    const userPrompt = JSON.stringify({
      vibe: vibe ?? null,
      prompt: prompt ?? null,
      catalog: grouped,
    });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "compose_outfit",
              description: "Pick at most one product per slot to form a cohesive outfit.",
              parameters: {
                type: "object",
                properties: {
                  picks: {
                    type: "array",
                    description: "Up to 5 picks, one per slot.",
                    items: {
                      type: "object",
                      properties: {
                        product_id: { type: "string", description: "Catalog product id" },
                        tab: {
                          type: "string",
                          enum: ["top", "bottom", "shoes", "accessory", "jacket"],
                        },
                      },
                      required: ["product_id", "tab"],
                      additionalProperties: false,
                    },
                  },
                  note: { type: "string", description: "One-sentence stylist rationale" },
                },
                required: ["picks", "note"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "compose_outfit" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const ai = await aiRes.json();
    const call = ai?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      throw new Error("AI returned no tool call");
    }
    let args: { picks: { product_id: string; tab: string }[]; note: string };
    try {
      args = JSON.parse(call.function.arguments);
    } catch {
      throw new Error("AI returned malformed arguments");
    }

    // Validate against catalog and dedupe by tab.
    const seen = new Set<string>();
    const picks = (args.picks ?? [])
      .filter((p) => validIds.has(p.product_id))
      .filter((p) => {
        if (seen.has(p.tab)) return false;
        seen.add(p.tab);
        return true;
      })
      .slice(0, 5);

    return new Response(JSON.stringify({ picks, note: args.note ?? "" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-outfit error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});