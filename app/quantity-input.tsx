'use client';
import {useState} from 'react';

export default function QuantityInput({value,onChange,label}:{value:number,onChange:(value:number)=>void,label:string}){
  const [draft,setDraft]=useState<string|null>(null);
  return <input aria-label={label} type="text" inputMode="numeric" pattern="[0-9]*" value={draft??String(value)}
    onChange={e=>{
      const text=e.target.value;
      if(!/^\d*$/.test(text))return;
      setDraft(text);
      const number=Number(text);
      if(text!==''&&Number.isSafeInteger(number)&&number>=1&&number<=100000)onChange(number);
    }}
    onBlur={()=>{
      if(draft!==null&&draft!==''){
        const number=Number(draft);
        if(Number.isFinite(number))onChange(Math.max(1,Math.min(100000,Math.trunc(number))));
      }
      setDraft(null);
    }}
    onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}if(e.key==='Escape'){setDraft(null);e.currentTarget.blur();}}}
  />;
}
