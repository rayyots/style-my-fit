-- Wishlist
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Exchange requests
CREATE TYPE public.exchange_status AS ENUM ('requested','approved','rejected','completed','cancelled');

CREATE TABLE public.exchange_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  order_item_id UUID NOT NULL,
  product_id UUID NOT NULL,
  original_size TEXT NOT NULL,
  requested_size TEXT NOT NULL,
  reason TEXT,
  status public.exchange_status NOT NULL DEFAULT 'requested',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exchanges" ON public.exchange_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exchanges" ON public.exchange_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own exchanges" ON public.exchange_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status IN ('requested'));
CREATE POLICY "Admins manage exchanges" ON public.exchange_requests FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_exchange_updated BEFORE UPDATE ON public.exchange_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Order status: extend order_status enum to include shipped/delivered if missing, and let admins update orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='paid' AND enumtypid='public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'paid';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='shipped' AND enumtypid='public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'shipped';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='delivered' AND enumtypid='public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'delivered';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='cancelled' AND enumtypid='public.order_status'::regtype) THEN
    ALTER TYPE public.order_status ADD VALUE 'cancelled';
  END IF;
END $$;

-- Allow admins to update order status; users can cancel pending orders
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Users cancel own pending orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id);

-- Profile: avatar GLB URL for Ready Player Me
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_glb_url TEXT;