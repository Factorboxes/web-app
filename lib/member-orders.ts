export const memberOrderFilters = ['all', 'waiting', 'packing', 'shipping', 'delivered', 'cancelled'] as const;
export type MemberOrderFilter = typeof memberOrderFilters[number];
export const memberFilterLabels: Record<MemberOrderFilter, string> = {
  all: 'ทั้งหมด', waiting: 'รอชำระ / ตรวจสลิป', packing: 'รอแพ็ก / กำลังแพ็ก',
  shipping: 'กำลังจัดส่ง', delivered: 'ส่งสำเร็จ', cancelled: 'ยกเลิก',
};
export type OrderItem = {id: string; sku: string; name: string; size: string; category: string; qty: number; price: number};
export type MemberOrder = {
  id: string; order_no?: string | number | null; token: string; created: string;
  total: number; payment: string; status: string; carrier: string; tracking: string;
  items: string; pending_slips: number;
};
export type MemberOrderDetail = MemberOrder & {
  customer: string; phone: string; address: string; tax: string;
  subtotal: number; shipping: number; vat: number;
  coupon_code: string; coupon_discount: number; transferred_at: string | null;
};

/** Read the order snapshot; never substitute current catalog names, prices or quantities. */
export function purchasedItems(raw: string): OrderItem[] | null {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data.map((item, index) => {
      if (!item || typeof item.name !== 'string' || !item.name.trim() ||
        !Number.isSafeInteger(item.qty) || item.qty < 1 ||
        !Number.isSafeInteger(item.price) || item.price < 0 ||
        !Number.isSafeInteger(item.qty * item.price)) throw Error('Invalid saved item');
      return {id: String(item.id ?? index), sku: typeof item.sku === 'string' ? item.sku : '',
        name: item.name, size: typeof item.size === 'string' ? item.size : '',
        category: typeof item.category === 'string' ? item.category : '', qty: item.qty, price: item.price};
    });
  } catch { return null; }
}

export function memberStatus(order: Pick<MemberOrder, 'status' | 'payment' | 'pending_slips'>) {
  if (order.status === 'ยกเลิก') return {label: 'ยกเลิก', tone: 'red'};
  if (order.status === 'ส่งสำเร็จ') return {label: 'ส่งสำเร็จ', tone: 'teal'};
  if (order.status === 'จัดส่งแล้ว') return {label: 'กำลังจัดส่ง', tone: 'green'};
  if (order.status === 'กำลังแพ็ก') return {label: 'กำลังแพ็ก', tone: 'blue'};
  if (order.payment === 'ชำระแล้ว') return {label: 'รอแพ็ก', tone: 'blue'};
  if (order.pending_slips > 0) return {label: 'รอตรวจสลิป', tone: 'teal'};
  if (order.status === 'รอยืนยัน') return {label: 'รอยืนยันออเดอร์', tone: 'gray'};
  return {label: 'รอชำระ', tone: 'amber'};
}

export function savedOrderToken(value: string) {
  let token = value.trim();
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    try { token = new URL(token, 'https://factorboxes.invalid').searchParams.get('token') || ''; }
    catch { token = ''; }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))
    throw Error('กรุณาวางลิงก์ชำระเงินหรือลิงก์ติดตามที่ได้รับหลังสั่งซื้อ');
  return token;
}
