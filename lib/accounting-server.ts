import {db} from './server';
import {thaiToday} from './accounting';
export async function generateBills(actor:string){
 // Order lock serializes against payment/cancellation updates. Immutable snapshots, one active bill/order.
 const result=await db().prepare(`WITH candidates AS (
 SELECT o.*,t.due_date FROM orders o JOIN accounting_terms t ON t.order_id=o.id
 WHERE o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก' AND t.due_date<=?::date
 AND EXISTS(SELECT 1 FROM settings WHERE id='shop' AND length(trim(COALESCE(value::jsonb->>'seller','')))>0 AND length(trim(COALESCE(value::jsonb->>'sellerAddress','')))>0)
 AND NOT EXISTS(SELECT 1 FROM accounting_bills b WHERE b.order_id=o.id AND b.voided_at IS NULL)
 ORDER BY t.due_date,o.id LIMIT 500 FOR UPDATE OF o
 ), inserted AS (
 INSERT INTO accounting_bills(order_id,due_date,payload)
 SELECT c.id,c.due_date,jsonb_build_object('order',to_jsonb(c),'seller',COALESCE((SELECT value::jsonb FROM settings WHERE id='shop'),'{}'::jsonb)) FROM candidates c
 ON CONFLICT(order_id) WHERE voided_at IS NULL DO NOTHING RETURNING id
 ), audit AS (INSERT INTO accounting_audit(actor,action,target,detail) SELECT ?,'auto-billing','due-orders',count(*)::text FROM inserted HAVING count(*)>0) SELECT count(*) AS n FROM inserted`).bind(thaiToday(),actor).first<{n:number}>();
 return Number(result?.n||0);
}
export const entryBalanceSQL=`SELECT e.*,COALESCE(p.paid,0) AS paid,e.amount-COALESCE(p.paid,0) AS balance FROM accounting_entries e LEFT JOIN (SELECT entry_id,SUM(amount) AS paid FROM accounting_payments WHERE voided_at IS NULL GROUP BY entry_id) p ON p.entry_id=e.id`;
