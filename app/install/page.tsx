import type {Metadata} from 'next';
import InstallPage from './screen';
import './install.css';
export const metadata:Metadata={title:'ติดตั้ง FACTORBOXES บนมือถือ',description:'เพิ่มไอคอนร้าน FACTORBOXES ลงหน้าจอ iPhone และ Android พร้อมลิงก์และ QR Code'};
export default function Page(){return <InstallPage/>}
