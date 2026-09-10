export type MemberDirectoryRow={id:string;name:string;email:string;phone:string;address:string;postcode:string;updated:string};
export function missingMemberFields(m:Partial<MemberDirectoryRow>){
 const missing:string[]=[];
 if(!m.name?.trim())missing.push('ชื่อผู้รับ');
 if(!m.phone?.trim())missing.push('เบอร์โทร');
 if(!m.address?.trim())missing.push('ที่อยู่');
 if(!/^[0-9]{5}$/.test(m.postcode?.trim()||''))missing.push('รหัสไปรษณีย์');
 return missing;
}
