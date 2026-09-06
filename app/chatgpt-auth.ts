// Compatibility exports for existing UI, backed exclusively by Supabase Auth.
import {identity} from '@/lib/member';
import {redirect} from 'next/navigation';
export type ChatGPTUser={displayName:string,email:string,fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const user=await identity();return user?{displayName:user.email,email:user.email,fullName:null}:null}
export async function requireChatGPTUser(path:string){const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath(path));return user}
export function chatGPTSignInPath(path:string){return '/login?next='+encodeURIComponent(safePath(path))}
export function chatGPTSignOutPath(path='/'){return '/auth/signout?next='+encodeURIComponent(safePath(path))}
export function safePath(path:string){return path.startsWith('/')&&!path.startsWith('//')&&!path.includes('\\')?path:'/account'}
