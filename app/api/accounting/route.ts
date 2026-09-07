import {z} from 'zod';
import {db,isAdmin} from '@/lib/server';
import {identity} from '@/lib/member';
import {accountingDate,entrySchema,thaiToday} from '@/lib/accounting';
import {entryBalanceSQL,generateBills} from '@/lib/accounting-server';
import {salesRange} from '@/lib/sales';
export const dynamic='force-dynamic';
const json=(d:unknown,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){try{
 if(!await isAdmin('accounting'))return json({error:'ไม่มีสิทธิ์ดูบัญชี'},403);
 const q=new URL(request.url).searchParams,view=q.get('view')||'summary';const page=z.coerce.number().int().min(0).max(100000).parse(q.get('page')||0),limit=50,offset=page*limit;const search=z.string().max(100).parse(q.get('search')||'');const today=thaiToday();
 if(view==='summary'){
 const range=salesRange('month',q.get('date')||today);
 const cash=await db().prepare("SELECT COUNT(*) AS n,COALESCE(SUM(total),0) AS amount,COALESCE(SUM(vat),0) AS vat,COUNT(*) FILTER (WHERE transferred_at IS NULL) AS missing_date FROM orders WHERE payment='ชำระแล้ว' AND status<>'ยกเลิก' AND COALESCE(transferred_at,created)>=? AND COALESCE(transferred_at,created)<?").bind(range.start,range.end).first();
 const manual=(await db().prepare('SELECT e.kind,COALESCE(SUM(p.amount),0) AS amount FROM accounting_payments p JOIN accounting_entries e ON e.id=p.entry_id WHERE p.voided_at IS NULL AND e.voided_at IS NULL AND p.paid_at>=?::timestamptz AND p.paid_at<?::timestamptz GROUP BY e.kind').bind(range.start,range.end).all()).results;
 const ar=await db().prepare("SELECT COUNT(*) AS n,COALESCE(SUM(o.total),0) AS amount,COUNT(*) FILTER(WHERE t.due_date<=?::date) AS due FROM orders o LEFT JOIN accounting_terms t ON t.order_id=o.id WHERE o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก'").bind(today).first();
 const balances=(await db().prepare(`SELECT x.kind,COUNT(*) AS n,COALESCE(SUM(x.balance),0) AS amount,COUNT(*) FILTER(WHERE x.due_date<=?::date) AS due FROM (${entryBalanceSQL}) x WHERE x.voided_at IS NULL AND x.balance>0 GROUP BY x.kind`).bind(today).all()).results;
 const taxes=await db().prepare("SELECT COALESCE(SUM((payload::jsonb->'order'->>'vat')::bigint),0) AS vat,COUNT(*) AS n FROM documents WHERE type='tax' AND created>=? AND created<?").bind(range.start,range.end).first();
 const purchase=await db().prepare("SELECT COALESCE(SUM(vat),0) AS vat FROM accounting_entries WHERE kind='expense' AND voided_at IS NULL AND document_date>=?::date AND document_date<=?::date").bind(range.from,range.through).first();
 return json({cash,manual,ar,balances,taxes,purchase,range});
 }
 if(view==='orders'){
 const filter=q.get('filter')||'unpaid';if(!['all','unpaid','due','missing'].includes(filter))return json({error:'ตัวกรองไม่ถูกต้อง'},400);
 const where="o.status<>'ยกเลิก'"+(filter==='all'?'':" AND o.payment<>'ชำระแล้ว'")+(filter==='due'?' AND t.due_date<=?::date':filter==='missing'?' AND t.order_id IS NULL':'')+" AND (strpos(lower(o.customer),lower(?))>0 OR strpos(COALESCE(o.order_no::text,''),?)>0)";
 const params:unknown[]=[...(filter==='due'?[today]:[]),search,search];
 const rows=(await db().prepare(`SELECT o.id,o.order_no,o.created,o.customer,o.phone,o.total,o.payment,t.due_date::text AS due_date,t.assignee,t.note,b.id AS bill_id,(SELECT MAX(created_at) FROM accounting_notes WHERE order_id=o.id) AS last_followup FROM orders o LEFT JOIN accounting_terms t ON t.order_id=o.id LEFT JOIN accounting_bills b ON b.order_id=o.id AND b.voided_at IS NULL WHERE ${where} ORDER BY t.due_date NULLS LAST,o.created DESC LIMIT ? OFFSET ?`).bind(...params,limit+1,offset).all()).results;return json({rows:rows.slice(0,limit),more:rows.length>limit});
 }
 if(view==='entries'){
 const kind=z.enum(['income','expense']).parse(q.get('kind')||'expense');const due=q.get('filter')==='due';
 const rows=(await db().prepare(`SELECT x.*,x.due_date::text AS due_date,x.document_date::text AS document_date FROM (${entryBalanceSQL}) x WHERE x.kind=? AND x.voided_at IS NULL ${due?'AND x.balance>0 AND x.due_date<=?::date':''} AND (strpos(lower(x.counterparty),lower(?))>0 OR strpos(lower(x.reference),lower(?))>0) ORDER BY x.due_date,x.created_at DESC LIMIT ? OFFSET ?`).bind(kind,...(due?[today]:[]),search,search,limit+1,offset).all()).results;return json({rows:rows.slice(0,limit),more:rows.length>limit});
 }
 if(view==='documents'){
 const range=salesRange('month',q.get('date')||today);const rows=(await db().prepare("SELECT d.id,d.type,d.created,d.order_id,d.payload::jsonb->'order'->>'customer' AS customer,d.payload::jsonb->'order'->>'total' AS total FROM documents d WHERE created>=? AND created<? ORDER BY created DESC,id DESC LIMIT ? OFFSET ?").bind(range.start,range.end,limit+1,offset).all()).results;return json({rows:rows.slice(0,limit),more:rows.length>limit,range});
 }
 if(view==='detail'){
 const id=z.string().uuid().parse(q.get('id')),kind=z.enum(['order','entry']).parse(q.get('kind'));
 const notes=(await db().prepare('SELECT note,actor,created_at FROM accounting_notes WHERE '+(kind==='order'?'order_id':'entry_id')+'=? ORDER BY created_at DESC LIMIT 100').bind(id).all()).results;
 if(kind==='order')return json({notes,payments:[],files:[]});
 return json({notes,payments:(await db().prepare('SELECT id,amount,paid_at,reference,actor,voided_at,void_reason FROM accounting_payments WHERE entry_id=? ORDER BY created_at DESC LIMIT 100').bind(id).all()).results,files:(await db().prepare('SELECT id,mime,created_at FROM accounting_files WHERE entry_id=? ORDER BY created_at').bind(id).all()).results});
 }
 return json({error:'ไม่พบรายการ'},400);
 }catch(e){console.error('Accounting read failed',e);return json({error:'โหลดบัญชีไม่สำเร็จ ตรวจสอบวันที่ และติดตั้ง supabase/06-accounting.sql ก่อนใช้งานครั้งแรก'},400)}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin||!await isAdmin('accounting'))return json({error:'ไม่มีสิทธิ์แก้ไขบัญชี'},403);
 const actor=(await identity())!.email;const b=z.record(z.unknown()).parse(await request.json());
 if(b.action==='sync')return json({ok:true,generated:await generateBills(actor)});
 if(b.action==='terms'){
 const v=z.object({order:z.string().uuid(),due_date:accountingDate,assignee:z.string().trim().max(100),note:z.string().trim().max(1000)}).parse(b);
 // Lock prevents a concurrent billing run from snapshotting an obsolete due date.
 await db().batch([db().prepare('SELECT id FROM orders WHERE id=? FOR UPDATE').bind(v.order),db().prepare(`INSERT INTO accounting_terms(order_id,due_date,assignee,note) SELECT id,?::date,?,? FROM orders WHERE id=? ON CONFLICT(order_id) DO UPDATE SET due_date=excluded.due_date,assignee=excluded.assignee,note=excluded.note,updated_at=now()` ).bind(v.due_date,v.assignee,v.note,v.order),db().prepare("UPDATE accounting_bills SET voided_at=now(),void_reason='เปลี่ยนวันครบกำหนด' WHERE order_id=? AND voided_at IS NULL AND due_date<>?::date").bind(v.order,v.due_date),db().prepare('INSERT INTO accounting_audit(actor,action,target,detail) VALUES (?,?,?,?)').bind(actor,'terms',v.order,JSON.stringify(v))]);await generateBills(actor);return json({ok:true});
 }
 if(b.action==='entry'){
 const v=entrySchema.parse(b);await db().batch([db().prepare('INSERT INTO accounting_entries(id,kind,document_date,due_date,counterparty,reference,category,description,amount,vat,assignee) VALUES (?,?,?::date,?::date,?,?,?,?,?,?,?)').bind(v.id,v.kind,v.document_date,v.due_date,v.counterparty,v.reference,v.category,v.description,v.amount,v.vat,v.assignee),db().prepare('INSERT INTO accounting_audit(actor,action,target) VALUES (?,?,?)').bind(actor,'entry',v.id)]);return json({ok:true});
 }
 if(b.action==='payment'){
 const v=z.object({id:z.string().uuid(),entry:z.string().uuid(),amount:z.number().int().positive().max(100000000000),paid_at:z.string().datetime({offset:true}),reference:z.string().trim().max(200)}).parse(b);await db().prepare('SELECT accounting_pay(?::uuid,?::uuid,?,?::timestamptz,?,?)').bind(v.id,v.entry,v.amount,v.paid_at,v.reference,actor).first();return json({ok:true});
 }
 if(b.action==='order-payment'){
 const v=z.object({order:z.string().uuid(),paid_at:z.string().datetime({offset:true})}).parse(b);if(Date.parse(v.paid_at)>Date.now()+300000)return json({error:'วันเวลาโอนต้องไม่อยู่ในอนาคต'},400);
 const result=await db().prepare("WITH updated AS (UPDATE orders SET payment='ชำระแล้ว',status=CASE WHEN status IN ('รอยืนยัน','รอชำระเงิน') THEN 'ชำระแล้ว' ELSE status END,transferred_at=? WHERE id=? AND status<>'ยกเลิก' AND payment<>'ชำระแล้ว' RETURNING id), audit AS (INSERT INTO accounting_audit(actor,action,target,detail) SELECT ?,'order-payment',id,? FROM updated) SELECT COUNT(*) AS n FROM updated").bind(v.paid_at,v.order,actor,v.paid_at).first<{n:number}>();if(!Number(result?.n)){const previous=await db().prepare('SELECT payment,status,transferred_at FROM orders WHERE id=?').bind(v.order).first();if(previous?.payment==='ชำระแล้ว'&&previous.status!=='ยกเลิก'&&previous.transferred_at===v.paid_at)return json({ok:true});return json({error:'ออเดอร์นี้ถูกยกเลิก ชำระแล้ว หรือไม่พบออเดอร์ กรุณารีเฟรช'},409)}return json({ok:true});
 }
 if(b.action==='note'){
 const v=z.object({id:z.string().uuid(),kind:z.enum(['order','entry']),note:z.string().trim().min(1).max(1000)}).parse(b);await db().prepare('INSERT INTO accounting_notes(order_id,entry_id,note,actor) VALUES (?,?,?,?)').bind(v.kind==='order'?v.id:null,v.kind==='entry'?v.id:null,v.note,actor).run();return json({ok:true});
 }
 if(b.action==='void-payment'){
 const v=z.object({id:z.string().uuid(),reason:z.string().trim().min(3).max(500)}).parse(b);await db().batch([db().prepare('SELECT e.id FROM accounting_entries e JOIN accounting_payments p ON p.entry_id=e.id WHERE p.id=? FOR UPDATE OF e').bind(v.id),db().prepare('UPDATE accounting_payments SET voided_at=now(),void_reason=? WHERE id=? AND voided_at IS NULL').bind(v.reason,v.id),db().prepare('INSERT INTO accounting_audit(actor,action,target,detail) VALUES (?,?,?,?)').bind(actor,'void-payment',v.id,v.reason)]);return json({ok:true});
 }
 if(b.action==='void-entry'){
 const v=z.object({id:z.string().uuid(),reason:z.string().trim().min(3).max(500)}).parse(b);const results=await db().batch([db().prepare('SELECT id FROM accounting_entries WHERE id=? FOR UPDATE').bind(v.id),db().prepare('UPDATE accounting_entries SET voided_at=now(),void_reason=? WHERE id=? AND voided_at IS NULL AND NOT EXISTS(SELECT 1 FROM accounting_payments WHERE entry_id=? AND voided_at IS NULL)').bind(v.reason,v.id,v.id)]);if(!results[1].rowCount)return json({error:'ยกเลิกไม่ได้ ต้องยกเลิกรายการชำระเงินก่อน หรือรายการถูกยกเลิกแล้ว'},409);await db().prepare('INSERT INTO accounting_audit(actor,action,target,detail) VALUES (?,?,?,?)').bind(actor,'void-entry',v.id,v.reason).run();return json({ok:true});
 }
 return json({error:'คำขอไม่ถูกต้อง'},400);
 }catch(e){console.error('Accounting write failed',e);return json({error:e instanceof z.ZodError?'ตรวจสอบข้อมูลและจำนวนเงินให้ถูกต้อง':'บันทึกไม่สำเร็จ อาจมีเลขอ้างอิงซ้ำ ยอดชำระเกินคงเหลือ หรือข้อมูลเปลี่ยนแล้ว กรุณารีเฟรชตรวจสอบก่อนลองอีกครั้ง'},400)}}
