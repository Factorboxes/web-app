export const salesPeriods=['day','week','month','year'] as const;
export type SalesPeriod=typeof salesPeriods[number];
export function salesRange(period:SalesPeriod,date:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('วันที่ไม่ถูกต้อง');
 const start=new Date(date+'T00:00:00Z');if(!Number.isFinite(start.getTime())||start.toISOString().slice(0,10)!==date)throw Error('วันที่ไม่ถูกต้อง');
 if(period==='week')start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);
 if(period==='month')start.setUTCDate(1);
 if(period==='year'){start.setUTCMonth(0,1);}
 const end=new Date(start);
 if(period==='day')end.setUTCDate(end.getUTCDate()+1);
 if(period==='week')end.setUTCDate(end.getUTCDate()+7);
 if(period==='month')end.setUTCMonth(end.getUTCMonth()+1);
 if(period==='year')end.setUTCFullYear(end.getUTCFullYear()+1);
 return {start:new Date(start.getTime()-7*3600000).toISOString(),end:new Date(end.getTime()-7*3600000).toISOString(),from:start.toISOString().slice(0,10),through:new Date(end.getTime()-86400000).toISOString().slice(0,10),format:period==='day'?'YYYY-MM-DD HH24:00':period==='year'?'YYYY-MM':'YYYY-MM-DD'};
}
