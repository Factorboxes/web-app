import {redirect} from 'next/navigation';
import Guide from './guide/screen';
import './guide/guide.css';
export {metadata} from './guide/page';

export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const mode=Array.isArray(params.mode)?params.mode[0]:params.mode;
 // Preserve existing registration, password reset and protected-page login links.
 if(['signup','password','reset'].includes(mode||'') || params.next){
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(params)){
   if(Array.isArray(value))value.forEach(v=>query.append(key,v));
   else if(value!==undefined)query.set(key,value);
  }
  redirect('/login?'+query.toString());
 }
 return <Guide/>;
}
