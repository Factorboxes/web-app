import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{return {
 id:'/',name:'FACTORBOXES — โรงงานผลิตกล่องพัสดุ',short_name:'FACTORBOXES',description:'เลือกซื้อกล่อง ตรวจสอบออเดอร์ และติดตามพัสดุ',lang:'th',start_url:'/?source=pwa',scope:'/',display:'standalone',background_color:'#f26700',theme_color:'#f26700',
 icons:[{src:'/app-icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/app-icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/app-icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]
}}
