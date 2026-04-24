import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AvatarConfig, fetchAvatar } from "@/lib/avatar";
import { deriveSizeTiers, SizeTier } from "@/lib/sizing";

export interface UserCtx {
  loading: boolean;
  profile: { gender?: string; height_cm?: number; weight_kg?: number; name?: string } | null;
  avatar: AvatarConfig | null;
  sizeTier: SizeTier | null;
  recommendedSizes: SizeTier[];
  isAdmin: boolean;
  bodyScale: number;
}

export function useUserContext(): UserCtx {
  const { user, loading: authLoading } = useAuth();
  const [ctx, setCtx] = useState<UserCtx>({
    loading: true, profile: null, avatar: null, sizeTier: null, recommendedSizes: [], isAdmin: false, bodyScale: 1,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCtx((c) => ({ ...c, loading: false })); return; }
    (async () => {
      const [{ data: profile }, av, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("name,gender,height_cm,weight_kg").eq("id", user.id).maybeSingle(),
        fetchAvatar(user.id),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const isAdmin = !!roles?.some((r: any) => r.role === "admin");
      let sizeTier = null, recommendedSizes: SizeTier[] = [];
      let bodyScale = 1;
      if (profile?.height_cm && profile?.weight_kg) {
        const t = deriveSizeTiers({
          height_cm: Number(profile.height_cm),
          weight_kg: Number(profile.weight_kg),
          gender: profile.gender || "nonbinary",
        });
        sizeTier = t.primary;
        recommendedSizes = t.recommended;
        bodyScale = Math.min(1.18, Math.max(0.82, Number(profile.height_cm) / 170));
      }
      setCtx({ loading: false, profile, avatar: av, sizeTier, recommendedSizes, isAdmin, bodyScale });
    })();
  }, [user, authLoading]);

  return ctx;
}
