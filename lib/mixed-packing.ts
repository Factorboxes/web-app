export type ParcelGroup={count:number;weightKg:number;lines:{id:string;name:string;qty:number}[]};
export function mixedPacking(items:{id?:string;name?:string;qty:number;parcelCapacity?:number|null;parcelWeightKg?:number}[]){
 const valid=items.every(i=>Number.isSafeInteger(i.qty)&&i.qty>0&&Number.isSafeInteger(i.parcelCapacity)&&Number(i.parcelCapacity)>0&&Number.isFinite(i.parcelWeightKg)&&Number(i.parcelWeightKg)>0&&Number(i.parcelWeightKg)<=25);
 if(!valid)return {valid:false,groups:[] as ParcelGroup[],parcelCount:0};
 const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;
 let scale=1n;for(const i of items){const n=BigInt(i.parcelCapacity!);scale=scale/gcd(scale,n)*n;}
 const limit=25000000n*scale;
 const sorted=items.map((i,index)=>({...i,id:i.id??String(index),name:i.name??i.id??String(index),unit:BigInt(Math.ceil(i.parcelWeightKg!*1000000))*scale/BigInt(i.parcelCapacity!)})).sort((a,b)=>a.unit>b.unit?-1:a.unit<b.unit?1:a.id.localeCompare(b.id));
 type Group={count:number;weight:bigint;lines:{id:string;name:string;qty:number}[]};
 let bins:Group[]=[];
 for(const item of sorted){
  let qty=item.qty;const next:Group[]=[];
  // Fill the fullest existing groups first, splitting repeated groups as necessary.
  bins.sort((a,b)=>a.weight>b.weight?-1:a.weight<b.weight?1:0);
  for(const bin of bins){
   const fit=Number((limit-bin.weight)/item.unit);
   if(!qty||fit<=0){next.push(bin);continue;}
   const whole=Math.min(bin.count,Math.floor(qty/fit));
   if(whole){next.push({count:whole,weight:bin.weight+BigInt(fit)*item.unit,lines:[...bin.lines,{id:item.id,name:item.name,qty:fit}]});qty-=whole*fit;}
   let rest=bin.count-whole;
   if(rest&&qty){const n=Math.min(qty,fit);next.push({count:1,weight:bin.weight+BigInt(n)*item.unit,lines:[...bin.lines,{id:item.id,name:item.name,qty:n}]});qty-=n;rest--;}
   if(rest)next.push({...bin,count:rest});
  }
  const fit=Number(limit/item.unit),whole=Math.floor(qty/fit),remainder=qty%fit;
  if(whole)next.push({count:whole,weight:BigInt(fit)*item.unit,lines:[{id:item.id,name:item.name,qty:fit}]});
  if(remainder)next.push({count:1,weight:BigInt(remainder)*item.unit,lines:[{id:item.id,name:item.name,qty:remainder}]});
  bins=next;
 }
 const groups=bins.map(b=>({count:b.count,weightKg:Number(b.weight)/Number(scale)/1000000,lines:b.lines}));
 return {valid:true,groups,parcelCount:groups.reduce((n,b)=>n+b.count,0)};
}
