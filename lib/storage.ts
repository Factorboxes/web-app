import 'server-only';
import {createClient} from '@supabase/supabase-js';
function storage(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}}).storage.from('factorboxes')}
export const storageBucket={async put(key:string,bytes:Uint8Array,options:{httpMetadata:{contentType:string}}){const {error}=await storage().upload(key,bytes,{contentType:options.httpMetadata.contentType,upsert:false});if(error)throw error},async get(key:string){const {data,error}=await storage().download(key);if(error||!data)return null;return {body:data.stream()}},async delete(key:string){const {error}=await storage().remove([key]);if(error)throw error}};
