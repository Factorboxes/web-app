import type {Metadata} from 'next';
import './globals.css';
import './redesign.css';
import './storefront.css';
import './login/login.css';
import {PwaProvider} from './pwa';
import VisitTracker from './visit-tracker';
import {BrandingProvider} from './branding-context';
export const metadata:Metadata={title:'FACTORBOXES | กล่องพร้อมส่ง',description:'เลือกกล่องไปรษณีย์ สั่งซื้อออนไลน์ และติดตามพัสดุ FACTORBOXES',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'FACTORBOXES',statusBarStyle:'default'},icons:{apple:'/app-icons/apple-touch-icon.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><body><BrandingProvider><PwaProvider><VisitTracker/>{children}</PwaProvider></BrandingProvider></body></html>}
