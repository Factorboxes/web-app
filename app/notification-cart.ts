'use client';
import {useEffect} from 'react';
export function useNotificationCart(cart:Record<string,number>,loaded:boolean,checkoutKey:string){
 const fingerprint=JSON.stringify(Object.entries(cart).filter(([,qty])=>qty>0).sort(([a],[b])=>a.localeCompare(b)));
 useEffect(()=>{
  if(!loaded||!checkoutKey)return;
  const send=()=>{if(document.visibilityState!=='visible')return;const items=Object.entries(cart).filter(([,qty])=>Number.isSafeInteger(qty)&&qty>0).map(([id,qty])=>({id,qty}));fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cart',items,checkoutKey}),keepalive:true}).catch(()=>{})};
  const timer=setTimeout(send,800),pulse=setInterval(send,120000);document.addEventListener('visibilitychange',send);window.addEventListener('notification-preferences-updated',send);
  return()=>{clearTimeout(timer);clearInterval(pulse);document.removeEventListener('visibilitychange',send);window.removeEventListener('notification-preferences-updated',send)};
 // fingerprint captures the cart contents; only authenticated, opted-in carts are saved by the API.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[fingerprint,loaded,checkoutKey]);
}
