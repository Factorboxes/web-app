'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {defaultBranding,type Branding} from '@/lib/branding';
const Context=createContext<Branding>(defaultBranding);
export function BrandingProvider({children}:{children:React.ReactNode}){const [branding,setBranding]=useState(defaultBranding);useEffect(()=>{const load=()=>fetch('/api/branding',{cache:'no-store'}).then(r=>r.ok?r.json():null).then((d:any)=>{if(d?.branding)setBranding(d.branding)}).catch(()=>{});load();window.addEventListener('branding-updated',load);return ()=>window.removeEventListener('branding-updated',load)},[]);return <Context.Provider value={branding}>{children}</Context.Provider>}
export const useBranding=()=>useContext(Context);
