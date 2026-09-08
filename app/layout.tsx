import type {Metadata} from 'next';
import Script from 'next/script';
import './globals.css';
import './redesign.css';
import './storefront.css';
import './login/login.css';
import {PwaProvider} from './pwa';
import VisitTracker from './visit-tracker';
import {BrandingProvider} from './branding-context';
export const metadata:Metadata={title:'FACTORBOXES | กล่องพร้อมส่ง',description:'เลือกกล่องไปรษณีย์ สั่งซื้อออนไลน์ และติดตามพัสดุ FACTORBOXES',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'FACTORBOXES',statusBarStyle:'default'},icons:{apple:'/app-icons/apple-touch-icon.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><body>
  <Script id="factorboxes-google-ads-init" strategy="afterInteractive">{`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-16714852853');
  `}</Script>
  <Script id="factorboxes-google-ads-library" src="https://www.googletagmanager.com/gtag/js?id=AW-16714852853" strategy="afterInteractive"/>
  <BrandingProvider><PwaProvider><VisitTracker/>{children}</PwaProvider></BrandingProvider></body></html>}
