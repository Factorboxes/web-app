'use client';

import {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import './price-list-viewer.css';

const clampZoom = (value: number) => Math.min(4, Math.max(1, value));

export default function PriceListViewer({src, title = 'ใบราคากล่องไปรษณีย์', description = 'ใบราคากล่อง FACTORBOXES 40 รายการ แบ่งตามยอดสั่งซื้อ 5 เรท', downloadName = 'factorboxes-price-list.jpg'}: {src: string; title?: string; description?: string; downloadName?: string}) {
  const titleId = useId();
  const hintId = useId();
  const dialogId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const zoomValue = useRef(1);
  const anchor = useRef<{x: number; y: number; pointX: number; pointY: number} | null>(null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(0);
  const [failed, setFailed] = useState(false);

  function show(button: HTMLButtonElement) {
    opener.current = button;
    zoomValue.current = 1;
    setZoom(1);
    setFailed(false);
    setOpen(true);
  }

  function changeZoom(value: number, point?: {x: number; y: number}) {
    const pane = viewport.current;
    const picture = image.current;
    const next = Math.round(clampZoom(value) * 100) / 100;
    if (!pane || !picture || next === zoomValue.current) return;
    const bounds = pane.getBoundingClientRect();
    const rect = picture.getBoundingClientRect();
    const pointX = point ? point.x - bounds.left : pane.clientWidth / 2;
    const pointY = point ? point.y - bounds.top : pane.clientHeight / 2;
    anchor.current = {
      x: (bounds.left + pointX - rect.left) / zoomValue.current,
      y: (bounds.top + pointY - rect.top) / zoomValue.current,
      pointX,
      pointY,
    };
    zoomValue.current = next;
    setZoom(next);
  }

  useLayoutEffect(() => {
    const pane = viewport.current;
    const picture = image.current;
    const pending = anchor.current;
    if (!pane || !picture || !pending) return;
    const bounds = pane.getBoundingClientRect();
    const rect = picture.getBoundingClientRect();
    const left = rect.left - bounds.left + pane.scrollLeft;
    const top = rect.top - bounds.top + pane.scrollTop;
    pane.scrollLeft = left + pending.x * zoom - pending.pointX;
    pane.scrollTop = top + pending.y * zoom - pending.pointY;
    anchor.current = null;
  }, [zoom]);

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    const pane = viewport.current;
    if (!modal || !pane) return;
    const body = document.body;
    const html = document.documentElement;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previous = {position: body.style.position, top: body.style.top, left: body.style.left,
      width: body.style.width, overflow: body.style.overflow, htmlOverflow: html.style.overflow};

    // A fixed body prevents the page behind the viewer from moving in iOS standalone mode.
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    modal.showModal();
    pane.scrollTo(0, 0);
    closeButton.current?.focus({preventScroll: true});

    const measure = () => setBaseWidth(Math.max(1, Math.min(1000, pane.clientWidth - 24)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);

    let pinch: {distance: number; zoom: number} | null = null;
    const distance = (touches: TouchList) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
    const start = (event: TouchEvent) => {
      if (event.touches.length === 2) pinch = {distance: Math.max(1, distance(event.touches)), zoom: zoomValue.current};
    };
    const move = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      changeZoom(pinch.zoom * distance(event.touches) / pinch.distance, {
        x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
        y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
      });
    };
    const end = (event: TouchEvent) => {if (event.touches.length < 2) pinch = null;};
    pane.addEventListener('touchstart', start, {passive: true});
    pane.addEventListener('touchmove', move, {passive: false});
    pane.addEventListener('touchend', end);
    pane.addEventListener('touchcancel', end);

    return () => {
      observer.disconnect();
      pane.removeEventListener('touchstart', start);
      pane.removeEventListener('touchmove', move);
      pane.removeEventListener('touchend', end);
      pane.removeEventListener('touchcancel', end);
      if (modal.open) modal.close();
      Object.assign(body.style, {position: previous.position, top: previous.top,
        left: previous.left, width: previous.width, overflow: previous.overflow});
      html.style.overflow = previous.htmlOverflow;
      const scrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(scrollX, scrollY);
      opener.current?.focus({preventScroll: true});
      html.style.scrollBehavior = scrollBehavior;
      anchor.current = null;
    };
  }, [open]);

  return <>
    <button type="button" className="guide-sheet price-list-preview" aria-haspopup="dialog"
      aria-controls={dialogId} aria-label={`เปิด${title}ขนาดเต็ม`} onClick={event => show(event.currentTarget)}>
      <img src={src} alt={description} loading="lazy"/>
    </button>
    <div className="guide-price-bottom">
      <span>แตะภาพเพื่อดูใบราคา ขยาย–ย่อได้ และกดปิดเพื่อกลับหน้าเดิม</span>
      <button type="button" className="price-list-open" aria-haspopup="dialog" aria-controls={dialogId}
        onClick={event => show(event.currentTarget)}>ดูภาพใหญ่ ↗</button>
    </div>
    <dialog ref={dialog} id={dialogId} className="price-list-viewer" aria-labelledby={titleId}
      aria-describedby={hintId} onCancel={event => {event.preventDefault(); setOpen(false);}}
      onClose={() => {if (!dialog.current?.open) setOpen(false);}}>
      <div className="price-list-toolbar">
        <strong id={titleId}>{title}</strong>
        <button ref={closeButton} type="button" className="price-list-close" onClick={() => setOpen(false)}>
          <span aria-hidden="true">×</span> ปิด / กลับหน้าเดิม
        </button>
      </div>
      <div className="price-list-controls" role="group" aria-label="ขยายและย่อใบราคา">
        <button type="button" aria-label="ย่อใบราคา" disabled={zoom <= 1} onClick={() => changeZoom(zoomValue.current - 0.5)}>−</button>
        <output aria-label="ระดับการขยาย">{Math.round(zoom * 100)}%</output>
        <button type="button" aria-label="ขยายใบราคา" disabled={zoom >= 4} onClick={() => changeZoom(zoomValue.current + 0.5)}>+</button>
        <button type="button" className="price-list-fit" onClick={() => {
          anchor.current = null;
          zoomValue.current = 1;
          setZoom(1);
          viewport.current?.scrollTo(0, 0);
        }}>พอดีจอ</button>
        <a href={src} download={downloadName} aria-label="ดาวน์โหลดใบราคา">ดาวน์โหลด ↓</a>
      </div>
      <p id={hintId} className="price-list-hint">ใช้สองนิ้วหรือปุ่ม + เพื่อขยาย แล้วเลื่อนภาพดูราคา</p>
      <div ref={viewport} className="price-list-viewport" tabIndex={0} aria-label="ภาพใบราคา เลื่อนดูได้">
        {open && (failed ? <p className="price-list-error" role="alert">โหลดภาพไม่สำเร็จ กรุณาปิดแล้วเปิดใหม่อีกครั้ง</p> :
          <img ref={image} className="price-list-full-image" src={src}
            style={{width: baseWidth ? baseWidth * zoom : '100%'}}
            alt={`${description} ขนาดเต็ม`} draggable={false} onError={() => setFailed(true)}/>)}
      </div>
    </dialog>
  </>;
}

