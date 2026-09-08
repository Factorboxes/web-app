'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
interface InstallPrompt extends Event {prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>}
const Context=createContext<{installed:boolean;ready:boolean;install:()=>Promise<boolean>}>({installed:false,ready:false,install:async()=>false});
export function PwaProvider({children}:{children:ReactNode}){
 const [event,setEvent]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const check=()=>setInstalled(media.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));check();
  const prompt=(e:Event)=>{e.preventDefault();setEvent(e as InstallPrompt)};
  const done=()=>{setInstalled(true);setEvent(null)};
  window.addEventListener('beforeinstallprompt',prompt);window.addEventListener('appinstalled',done);media.addEventListener('change',check);
  if(window.isSecureContext&&'serviceWorker' in navigator&&!location.pathname.startsWith('/admin'))navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{});
  return()=>{window.removeEventListener('beforeinstallprompt',prompt);window.removeEventListener('appinstalled',done);media.removeEventListener('change',check)};
 },[]);
 async function install(){if(!event)return false;setEvent(null);try{await event.prompt();return(await event.userChoice).outcome==='accepted'}catch{return false}}
 return <Context.Provider value={{installed,ready:Boolean(event),install}}>{children}</Context.Provider>;
}
export const usePwa=()=>useContext(Context);
export function InstallLink({className=''}:{className?:string}){const {installed}=usePwa();return installed?null:<a className={className} href="/install">เพิ่มแอปลงหน้าจอมือถือ ↗</a>}
