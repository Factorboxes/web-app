import {db} from './server';
import {defaultBranding,type Branding} from './branding';
export async function getBranding():Promise<Branding>{const row=await db().prepare('SELECT value FROM settings WHERE id=?').bind('branding').first<{value:string}>();return {...defaultBranding,...(row?JSON.parse(row.value):{})};}
