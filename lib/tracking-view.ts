export function trackingToken(input:string){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const value=input.trim();
 if(uuid.test(value))return value.toLowerCase();
 try{const token=new URL(value).searchParams.get('token');return token&&uuid.test(token)?token.toLowerCase():null}catch{return null}
}
export function shipmentStage(status:string){
 if(status==='ยกเลิก')return -1;
 if(status==='ส่งสำเร็จ')return 3;
 if(status==='จัดส่งแล้ว')return 2;
 if(status==='กำลังแพ็ก')return 1;
 return 0;
}
export function carrierTrackingPage(name:string){
 const normalized=name.toLowerCase().replace(/\s/g,'');
 if(/j&t|jandt|เจแอนด์ที/.test(normalized))return 'https://www.jtexpress.co.th/service/track';
 if(/flash|แฟลช/.test(normalized))return 'https://www.flashexpress.co.th/fle/tracking';
 if(/kex|kerry|เคอรี่|เคอีเอ็กซ์/.test(normalized))return 'https://th.kex-express.com/th/track/';
 if(/ไปรษณีย์|thailandpost|thaipost|^ems$/.test(normalized))return 'https://track.thailandpost.com/';
 return null;
}
