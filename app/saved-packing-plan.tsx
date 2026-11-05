import {type ParcelGroup} from '@/lib/mixed-packing';
export default function SavedPackingPlan({raw}:{raw:string}){
 let groups:ParcelGroup[]=[];
 try{const items=JSON.parse(raw);groups=items?.[0]?.mixedPlan??[];}catch{return null;}
 if(!groups.length)return null;
 return <section><h3>แผนจัดห่อผสมที่บันทึกไว้</h3>{groups.map((g,i)=><p key={i}><b>{g.count} ห่อ × {g.weightKg.toFixed(3)} กก./ห่อ</b><br/>{g.lines.map(l=>`${l.name} ${l.qty} หน่วย`).join(' + ')}</p>)}</section>;
}
