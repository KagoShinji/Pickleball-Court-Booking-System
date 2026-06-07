-- Remove the stale 13-parameter create_booking_atomic overload so RPC resolution
-- is unambiguous after the discount_applied hardening change.

DROP FUNCTION IF EXISTS public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text
);
