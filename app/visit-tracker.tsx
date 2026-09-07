'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {trackedPaths} from '@/lib/analytics';
export default function VisitTracker(){const path=usePathname();useEffect(()=>{
 if(!trackedPaths.includes(path as typeof trackedPaths[number])||navigator.doNotTrack==='1')return;
 function record(){if(document.visibilityState!=='visible')return;try{
 let visitor=localStorage.getItem('factorboxes-visitor');if(!visitor||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(visitor)){visitor=crypto.randomUUID();localStorage.setItem('factorboxes-visitor',visitor)}
 void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor,path}),keepalive:true}).catch(()=>{});
 }catch{/* Analytics must never interrupt shopping. */}}
 record();const visible=()=>{record()};document.addEventListener('visibilitychange',visible);return()=>document.removeEventListener('visibilitychange',visible);
 },[path]);return null}
