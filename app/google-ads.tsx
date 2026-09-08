'use client';
import Script from 'next/script';
export default function GoogleAds(){return <>
 <Script id="factorboxes-google-ads-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-16714852853');`}</Script>
 <Script id="factorboxes-google-ads-library" src="https://www.googletagmanager.com/gtag/js?id=AW-16714852853" strategy="afterInteractive" onReady={()=>{document.documentElement.dataset.googleAds='loaded';window.dispatchEvent(new Event('factorboxes-google-ready'))}} onError={()=>{document.documentElement.dataset.googleAds='error';window.dispatchEvent(new Event('factorboxes-google-error'))}}/>
 </>}
