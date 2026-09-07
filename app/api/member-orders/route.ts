import {z} from 'zod';
import {identity} from '@/lib/member';
import {db} from '@/lib/server';
import {memberOrderFilters} from '@/lib/member-orders';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store'};
const pending = "(SELECT COUNT(*) FROM slips s WHERE s.order_id=o.id AND s.status='รอตรวจสอบ') AS pending_slips";

export async function GET(request: Request) {
  try {
    const user = await identity();
    if (!user) return Response.json({error: 'กรุณาเข้าสู่ระบบเพื่อดูคำสั่งซื้อของคุณ'}, {status: 401, headers});
    const params = z.object({
      id: z.string().min(1).max(100).optional(),
      query: z.string().trim().max(100).default(''),
      filter: z.enum(memberOrderFilters).default('all'),
      page: z.coerce.number().int().min(1).max(100000).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(Object.fromEntries(new URL(request.url).searchParams));
    if (params.id) {
      const order = await db().prepare(`SELECT o.id,o.order_no,o.token,o.created,o.customer,o.phone,o.address,o.tax,o.items,o.subtotal,o.shipping,o.vat,o.total,o.status,o.carrier,o.tracking,o.payment,o.coupon_code,o.coupon_discount,o.transferred_at,${pending} FROM orders o WHERE o.member_id=? AND o.id=?`).bind(user.id, params.id).first();
      return order ? Response.json({order}, {headers}) : Response.json({error: 'ไม่พบคำสั่งซื้อนี้ในบัญชีของคุณ'}, {status: 404, headers});
    }
    const where = ['o.member_id=?'];
    const values: unknown[] = [user.id];
    const conditions: Record<string, string> = {
      waiting: "o.payment<>'ชำระแล้ว' AND o.status<>'ยกเลิก'",
      packing: "o.payment='ชำระแล้ว' AND o.status IN ('ชำระแล้ว','กำลังแพ็ก','รอยืนยัน','รอชำระเงิน')",
      shipping: "o.status='จัดส่งแล้ว'", delivered: "o.status='ส่งสำเร็จ'", cancelled: "o.status='ยกเลิก'",
    };
    if (conditions[params.filter]) where.push('(' + conditions[params.filter] + ')');
    if (params.query) {
      if (/^\d+$/.test(params.query)) {
        where.push('(o.order_no::text=? OR LOWER(o.tracking)=LOWER(?))');
        values.push(BigInt(params.query).toString(), params.query);
      } else {
        const pattern = '%' + params.query.replace(/[\\%_]/g, '\\$&') + '%';
        where.push("(LOWER('FB-'||substr(o.id,1,8)) LIKE LOWER(?) OR o.tracking ILIKE ? OR o.items ILIKE ?)");
        values.push(pattern, pattern, pattern);
      }
    }
    const clause = ' WHERE ' + where.join(' AND ');
    const count = await db().prepare('SELECT COUNT(*) AS total FROM orders o' + clause).bind(...values).first<{total: number}>();
    const rows = await db().prepare(`SELECT o.id,o.order_no,o.token,o.created,o.total,o.status,o.carrier,o.tracking,o.payment,o.items,${pending} FROM orders o` + clause + ' ORDER BY o.created DESC,o.id DESC LIMIT ? OFFSET ?')
      .bind(...values, params.limit, (params.page - 1) * params.limit).all();
    return Response.json({orders: rows.results, total: count?.total || 0, page: params.page, limit: params.limit}, {headers});
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({error: 'คำค้นหรือหน้ารายการไม่ถูกต้อง'}, {status: 400, headers});
    console.error(error);
    return Response.json({error: 'โหลดประวัติไม่สำเร็จ กรุณาลองอีกครั้ง'}, {status: 503, headers});
  }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error: 'คำขอไม่ถูกต้อง'}, {status: 403, headers});
    const user = await identity();
    if (!user) return Response.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401, headers});
    const b = z.object({token: z.string().uuid()}).parse(await request.json());
    const result = await db().prepare('UPDATE orders SET member_id=? WHERE token=? AND (member_id IS NULL OR member_id=?)').bind(user.id, b.token, user.id).run();
    if (!result.meta.changes) return Response.json({error: 'ไม่พบลิงก์นี้ หรือคำสั่งซื้อนี้อยู่ในบัญชีอื่นแล้ว'}, {status: 404, headers});
    return Response.json({ok: true}, {headers});
  } catch (error) {
    console.error(error);
    return Response.json({error: 'ตรวจสอบลิงก์คำสั่งซื้ออีกครั้ง'}, {status: 400, headers});
  }
}
