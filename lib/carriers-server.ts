import {db} from './server';
import {carrierListSchema,defaultCarriers} from './carriers';
export async function getCarriers():Promise<string[]>{
 const row=await db().prepare('SELECT value FROM settings WHERE id=?').bind('shipping-carriers').first<{value:string}>();
 return row?carrierListSchema.parse(JSON.parse(row.value)):[...defaultCarriers];
}
