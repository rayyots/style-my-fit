import { supabase } from "@/integrations/supabase/client";

export type ExchangeStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export interface ExchangeRow {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  original_size: string;
  requested_size: string;
  reason: string | null;
  status: ExchangeStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

/** Exchange window: 14 days after order created. */
export const EXCHANGE_WINDOW_DAYS = 14;

/** Order is exchange-eligible only when paid or delivered, within the window, not cancelled. */
export function isExchangeEligible(orderStatus: string, createdAt: string): {
  eligible: boolean;
  reason?: string;
  daysLeft: number;
} {
  const eligibleStatuses = ["paid", "shipped", "delivered"];
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  const daysLeft = Math.max(0, Math.ceil(EXCHANGE_WINDOW_DAYS - ageDays));
  if (orderStatus === "cancelled")
    return { eligible: false, reason: "Order was cancelled.", daysLeft: 0 };
  if (orderStatus === "pending")
    return { eligible: false, reason: "Order has not been paid yet.", daysLeft };
  if (!eligibleStatuses.includes(orderStatus))
    return { eligible: false, reason: "Status not eligible.", daysLeft };
  if (ageDays > EXCHANGE_WINDOW_DAYS)
    return { eligible: false, reason: "Exchange window has expired.", daysLeft: 0 };
  return { eligible: true, daysLeft };
}

export async function listExchangesForOrder(orderId: string): Promise<ExchangeRow[]> {
  const { data, error } = await supabase
    .from("exchange_requests")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function listMyExchanges(userId: string): Promise<ExchangeRow[]> {
  const { data, error } = await supabase
    .from("exchange_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function createExchange(input: {
  user_id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  original_size: string;
  requested_size: string;
  reason?: string;
}) {
  const { error } = await supabase.from("exchange_requests").insert(input);
  if (error) throw error;
}

export async function cancelExchange(id: string) {
  const { error } = await supabase
    .from("exchange_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
}