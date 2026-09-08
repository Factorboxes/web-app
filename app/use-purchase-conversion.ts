'use client';
import {useEffect} from 'react';
import {queuePurchase,type PurchaseOrder} from '@/lib/google-purchase';
export function usePurchaseConversion(order:PurchaseOrder|null|undefined){
 const id=order?.id,total=order?.total,payment=order?.payment,status=order?.status;
 useEffect(()=>{
  if(!id||total===undefined||!payment||!status)return;
  const current={id,total,payment,status};
  if(queuePurchase(current))return;
  let attempts=0;
  const timer=setInterval(()=>{if(queuePurchase(current)||++attempts>=60)clearInterval(timer)},500);
  return()=>clearInterval(timer);
 },[id,total,payment,status]);
}
