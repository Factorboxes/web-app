import {z} from 'zod';
export const accountingDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{try{return new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s}catch{return false}},'วันที่ไม่ถูกต้อง');
export const thaiToday=()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10);
export const entrySchema=z.object({id:z.string().uuid(),kind:z.enum(['income','expense']),document_date:accountingDate,due_date:accountingDate,counterparty:z.string().trim().min(1).max(200),reference:z.string().trim().max(100),category:z.string().trim().min(1).max(100),description:z.string().trim().min(1).max(1000),amount:z.number().int().min(1).max(100000000000),vat:z.number().int().min(0).max(100000000000),assignee:z.string().trim().max(100)}).refine(e=>e.vat<=e.amount,'VAT ต้องไม่เกินยอดรวม');
export function dueState(due:string|null,balance:number,today=thaiToday()){return balance<=0?'ชำระครบ':!due?'ยังไม่ตั้งกำหนด':due<today?'เกินกำหนด':due===today?'ครบกำหนดวันนี้':'ยังไม่ถึงกำหนด'}
export const billNumber=(id:number|string)=>'BILL-'+String(id).padStart(7,'0');
export function csv(rows:unknown[][]){return '\ufeff'+rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}).join(',')).join('\r\n')}
export function escapeHtml(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
