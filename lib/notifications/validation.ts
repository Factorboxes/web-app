import {z} from 'zod';
// Only browser push services. Never send requests to arbitrary subscriber-supplied URLs.
export function safePushEndpoint(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&(
 u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.push.services.mozilla.com')||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.notify.windows.com')
 )}catch{return false}}
export const subscriptionSchema=z.object({endpoint:z.string().max(2048).refine(safePushEndpoint),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22}$/)})});
export const preferenceSchema=z.object({orders:z.boolean(),marketing:z.boolean(),cart_reminders:z.boolean(),reorder_reminders:z.boolean()});
export const safeTarget=(s:string)=>['/store','/notifications','/','/guide','/account/orders'].includes(s);
export function quietMarketing(now=new Date()){const hour=(now.getUTCHours()+7)%24;return hour<9||hour>=20}
export function retryDelay(attempt:number){return Math.min(21600,60*2**Math.min(attempt,8))}
