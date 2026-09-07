'use client';
import {ShoppingCart} from 'lucide-react';
import {money} from '@/lib/catalog';
import styles from './floating-cart.module.css';
export default function FloatingCart({items,total,open,onOpen}:{items:number,total:number,open:boolean,onOpen:()=>void}){return <><div className={styles.space} aria-hidden="true"/>{!open&&<button type="button" className={styles.button} onClick={onOpen} aria-label={`เปิดตะกร้า ${items} รายการ ยอดรวม ${money(total)} บาท`}><span className={styles.icon}><ShoppingCart size={27} aria-hidden="true"/><span className={styles.badge}>{items>99?'99+':items}</span></span><span className={styles.text}><strong>ตะกร้าสินค้า</strong><span aria-live="polite" aria-atomic="true">{items} รายการ · ฿{money(total)}</span></span></button>}</>}
