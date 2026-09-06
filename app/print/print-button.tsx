'use client';
export default function PrintButton(){return <div className="printtools"><button className="primary" onClick={()=>window.print()}>พิมพ์ / บันทึกเป็น PDF</button><a className="secondary" href="/admin">กลับหลังบ้าน</a><small>เลือกกระดาษ A4 และปิดหัว–ท้ายกระดาษของเบราว์เซอร์</small></div>}
