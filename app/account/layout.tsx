import type {Metadata} from 'next';
import {AccountHeader, AccountFooter} from './shell';
import './account.css';
export const metadata:Metadata = {title:'บัญชีของฉัน | FACTORBOXES',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function AccountLayout({children}:{children:React.ReactNode}) {
  return <div className="member-experience"><AccountHeader/><main className="member-main">{children}</main><AccountFooter/></div>;
}
