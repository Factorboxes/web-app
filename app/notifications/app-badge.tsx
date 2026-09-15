'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

// The worker owns badge writes, including requests that outlive page navigation.
// No credentials or customer counts are stored on the device by this component.
export default function AppBadge(){
 const path=usePathname();
 useEffect(()=>{
  if(!('serviceWorker' in navigator))return;
  let active=true;
  const refresh=()=>{
   if(!active||document.visibilityState==='hidden')return;
   const message={type:'factorboxes-refresh-badge'};
   if(navigator.serviceWorker.controller){navigator.serviceWorker.controller.postMessage(message);return}
   void navigator.serviceWorker.getRegistration('/').then(reg=>{if(active)reg?.active?.postMessage(message)}).catch(()=>{});
  };
  refresh();
  const timer=setInterval(refresh,60000);
  window.addEventListener('notification-read',refresh);
  window.addEventListener('notification-badge-refresh',refresh);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('online',refresh);
  document.addEventListener('visibilitychange',refresh);
  navigator.serviceWorker.addEventListener('controllerchange',refresh);
  return()=>{
   active=false;clearInterval(timer);
   window.removeEventListener('notification-read',refresh);
   window.removeEventListener('notification-badge-refresh',refresh);
   window.removeEventListener('pageshow',refresh);
   window.removeEventListener('online',refresh);
   document.removeEventListener('visibilitychange',refresh);
   navigator.serviceWorker.removeEventListener('controllerchange',refresh);
  };
 },[path]); // Also refresh after login/signout redirects while the shared layout stays mounted.
 return null;
}
