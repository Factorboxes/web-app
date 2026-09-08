'use client';
import {useEffect} from 'react';
import {queuePurchase,type PurchaseOrder} from '@/lib/google-purchase';
export function usePurchaseConversion(order:PurchaseOrder|null|undefined){
 const id=order?.id,total=order?.total,payment=order?.payment,status=order?.status;
 useEffect(()=>{
  if(!id||total===undefined||!payment||!status)return;
  const current={id,total,payment,status};let timer:ReturnType<typeof setInterval>|undefined;
  const retry=()=>{if(queuePurchase(current)&&timer){clearInterval(timer);timer=undefined}};
  if(!queuePurchase(current))timer=setInterval(retry,2000);
  window.addEventListener('factorboxes-google-ready',retry);window.addEventListener('online',retry);document.addEventListener('visibilitychange',retry);
  return()=>{if(timer)clearInterval(timer);window.removeEventListener('factorboxes-google-ready',retry);window.removeEventListener('online',retry);document.removeEventListener('visibilitychange',retry)};
 },[id,total,payment,status]);
}
