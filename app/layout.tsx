import type {Metadata} from 'next';
import './globals.css';
import VisitTracker from './visit-tracker';
import {BrandingProvider} from './branding-context';
export const metadata:Metadata={title:'FACTORBOXES | กล่องพร้อมส่ง',description:'เลือกกล่องไปรษณีย์ สั่งซื้อออนไลน์ และติดตามพัสดุ FACTORBOXES'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><body><BrandingProvider><VisitTracker/>{children}</BrandingProvider></body></html>}
