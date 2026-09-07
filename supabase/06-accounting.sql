-- Run on the existing project after 04-order-numbers.sql. Safe to rerun.
BEGIN;
CREATE TABLE IF NOT EXISTS accounting_terms (
 order_id text PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
 due_date date NOT NULL,
 assignee text NOT NULL DEFAULT '',
 note text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS accounting_bills (
 id bigserial PRIMARY KEY,
 order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 issued_at timestamptz NOT NULL DEFAULT now(),
 due_date date NOT NULL,
 payload jsonb NOT NULL,
 voided_at timestamptz,
 void_reason text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS accounting_one_active_bill ON accounting_bills(order_id) WHERE voided_at IS NULL;
CREATE TABLE IF NOT EXISTS accounting_entries (
 id uuid PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('income','expense')),
 document_date date NOT NULL,
 due_date date NOT NULL,
 counterparty text NOT NULL,
 reference text NOT NULL DEFAULT '',
 category text NOT NULL,
 description text NOT NULL,
 amount bigint NOT NULL CHECK(amount>0),
 vat bigint NOT NULL DEFAULT 0 CHECK(vat>=0 AND vat<=amount),
 assignee text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 voided_at timestamptz,
 void_reason text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS accounting_entries_due ON accounting_entries(due_date);
CREATE UNIQUE INDEX IF NOT EXISTS accounting_entry_reference ON accounting_entries(kind,lower(counterparty),lower(reference)) WHERE reference<>'' AND voided_at IS NULL;
CREATE TABLE IF NOT EXISTS accounting_payments (
 id uuid PRIMARY KEY,
 entry_id uuid NOT NULL REFERENCES accounting_entries(id),
 amount bigint NOT NULL CHECK(amount>0),
 paid_at timestamptz NOT NULL,
 reference text NOT NULL DEFAULT '',
 actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 voided_at timestamptz,
 void_reason text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS accounting_payment_entry ON accounting_payments(entry_id);
CREATE TABLE IF NOT EXISTS accounting_notes (
 id bigserial PRIMARY KEY,
 order_id text REFERENCES orders(id) ON DELETE CASCADE,
 entry_id uuid REFERENCES accounting_entries(id),
 note text NOT NULL,
 actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((order_id IS NULL)<>(entry_id IS NULL))
);
CREATE TABLE IF NOT EXISTS accounting_files (
 id uuid PRIMARY KEY,
 entry_id uuid NOT NULL REFERENCES accounting_entries(id),
 storage_key text NOT NULL UNIQUE,
 mime text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS accounting_audit (
 id bigserial PRIMARY KEY,
 actor text NOT NULL,
 action text NOT NULL,
 target text NOT NULL,
 detail text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE accounting_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON accounting_terms,accounting_bills,accounting_entries,accounting_payments,accounting_notes,accounting_files,accounting_audit FROM anon,authenticated;
REVOKE ALL ON SEQUENCE accounting_bills_id_seq,accounting_notes_id_seq,accounting_audit_id_seq FROM anon,authenticated;
-- Concurrency-safe partial settlement. Repeated request IDs cannot double-pay.
CREATE OR REPLACE FUNCTION accounting_pay(p_id uuid,p_entry uuid,p_amount bigint,p_at timestamptz,p_ref text,p_actor text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE e accounting_entries%ROWTYPE; already accounting_payments%ROWTYPE; paid bigint;
BEGIN
 SELECT * INTO e FROM accounting_entries WHERE id=p_entry FOR UPDATE;
 IF NOT FOUND OR e.voided_at IS NOT NULL THEN RAISE EXCEPTION 'Entry unavailable'; END IF;
 SELECT * INTO already FROM accounting_payments WHERE id=p_id;
 IF FOUND THEN
  IF already.entry_id<>p_entry OR already.amount<>p_amount OR already.paid_at<>p_at OR already.reference<>p_ref THEN RAISE EXCEPTION 'Payment key conflict'; END IF;
  RETURN;
 END IF;
 SELECT COALESCE(SUM(amount),0) INTO paid FROM accounting_payments WHERE entry_id=p_entry AND voided_at IS NULL;
 IF p_amount<=0 OR p_amount>e.amount-paid OR p_at>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Invalid payment amount or date'; END IF;
 INSERT INTO accounting_payments(id,entry_id,amount,paid_at,reference,actor) VALUES(p_id,p_entry,p_amount,p_at,p_ref,p_actor);
 INSERT INTO accounting_audit(actor,action,target,detail) VALUES(p_actor,'payment',p_entry::text,p_id::text);
END $$;
REVOKE ALL ON FUNCTION accounting_pay(uuid,uuid,bigint,timestamptz,text,text) FROM PUBLIC,anon,authenticated;
COMMIT;
