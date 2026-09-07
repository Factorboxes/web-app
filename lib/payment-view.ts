export type BankDetails = {bank:string; bankName:string; accountName:string; accountNumber:string};

/** Structured settings take priority. Only extract one explicitly labelled legacy account. */
export function paymentBank(bank:BankDetails) {
  const matches=[...(bank.bank||'').matchAll(/(?:เลขบช|เลขบัญชี|บัญชีเลขที่)\s*[:：]?\s*([0-9][0-9 -]{8,20}[0-9])/g)];
  const legacy=matches.length===1?matches[0][1].replace(/[ -]/g,''):'';
  const number=(bank.accountNumber||'').trim()||(legacy.length===10?legacy:'');
  const digits=number.replace(/[\s-]/g,'');
  const numeric=/^\d+$/.test(digits);
  const name=(bank.bankName||'').trim()||(/กสิกร|kasikorn|kbank/i.test(bank.bank)?'ธนาคารกสิกรไทย':'');
  return {
    name,
    isKbank:/กสิกร|kasikorn|kbank/i.test(name),
    displayNumber:numeric&&digits.length===10?`${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`:number,
    copyNumber:numeric?digits:number,
  };
}

/** datetime-local values are entered in Thailand time, regardless of browser timezone. */
export function transferTimestamp(value:string, now=Date.now()) {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value))throw Error('กรุณาระบุวันที่และเวลาโอนเงิน');
  const timestamp=new Date(value+(value.length===16?':00':'')+'+07:00');
  if(!Number.isFinite(timestamp.getTime()))throw Error('วันที่หรือเวลาโอนเงินไม่ถูกต้อง');
  if(timestamp.getTime()>now+5*60*1000)throw Error('เวลาโอนเงินต้องไม่อยู่ในอนาคต');
  return timestamp.toISOString();
}

export function paymentDate(value?:string) {
  if(!value||!Number.isFinite(new Date(value).getTime()))return '';
  return new Date(value).toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
