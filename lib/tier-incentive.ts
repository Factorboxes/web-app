import {tierThresholds} from './catalog';
export function tierIncentive(items:{price:number,tiers?:number[],qty:number}[],freeShipping:number){
 const base=items.reduce((sum,i)=>sum+(i.tiers?.[0]??i.price)*i.qty,0);
 const index=tierThresholds.reduce((n,t,k)=>base>=t*100?k:n,0);
 const next=index+1<tierThresholds.length?index+1:null;
 const current=items.reduce((sum,i)=>sum+(i.tiers?.[index]??i.price)*i.qty,0);
 const nextTotal=next===null?current:items.reduce((sum,i)=>sum+(i.tiers?.[next]??i.price)*i.qty,0);
 const savings=Math.max(0,current-nextTotal);
 return {base,index,target:next===null?null:tierThresholds[next]*100,remaining:next===null?0:Math.max(0,tierThresholds[next]*100-base),shippingRemaining:Math.max(0,Math.round(freeShipping*100)-base),savings,percent:current>0?savings/current*100:0};
}
