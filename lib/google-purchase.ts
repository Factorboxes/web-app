export const PURCHASE_DESTINATION='AW-16714852853/IW8gCOKL-vAcEPXToaI-';
export type PurchaseOrder={id:string;total:number;payment:string;status:string};
export function purchasePayload(order:PurchaseOrder|null|undefined){
 if(!order||order.payment!=='ชำระแล้ว'||order.status==='ยกเลิก'||!order.id||!Number.isSafeInteger(order.total)||order.total<0)return null;
 return {send_to:PURCHASE_DESTINATION,value:order.total/100,currency:'THB',transaction_id:order.id};
}
const queued=new Set<string>();
export function queuePurchase(order:PurchaseOrder|null|undefined){
 const payload=purchasePayload(order);if(!payload||typeof window==='undefined')return true;
 const key='factorboxes-google-purchase:'+payload.send_to+':'+payload.transaction_id;
 if(queued.has(key))return true;
 try{if(localStorage.getItem(key)==='sent')return true}catch{}
 if(typeof document!=='undefined'&&document.documentElement.dataset.googleAds!=='loaded')return false;
 const tag=(window as Window&{gtag?:(...args:any[])=>void}).gtag;if(typeof tag!=='function')return false;
 queued.add(key);
 try{tag('event','conversion',{...payload,page_location:location.origin+location.pathname,event_callback:()=>{try{localStorage.setItem(key,'sent')}catch{}}});return true}
 catch{queued.delete(key);return false}
}
