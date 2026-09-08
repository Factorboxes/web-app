const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
(async()=>{
const lib={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/catalog.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(lib);
const a={code:'SALE5',kind:'percent',value:500,minimum:0,active:1,ends_at:null},b={...a,code:'EXTRA3',scope:'special',value:300};
const t=lib.totals([{price:100000,qty:1}],lib.defaultSettings,a,b);
assert.equal(t.couponDiscount,5000);assert.equal(t.specialDiscount,2850);assert.equal(t.subtotal,92150);assert.equal(t.total,92150);
assert.equal(lib.totals([{price:100,qty:1}],lib.defaultSettings,null,{...b,kind:'fixed',value:999}).subtotal,0);
assert.equal(lib.totals([{price:100000,qty:1}],lib.defaultSettings,a,{...b,minimum:96000}).specialDiscount,0);
const p=new PGlite();await p.exec("CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE coupons(code text PRIMARY KEY,kind text,value bigint,minimum bigint DEFAULT 0,active bigint DEFAULT 1,ends_at text);CREATE TABLE orders(id text PRIMARY KEY,coupon_code text,member_id text,created text,subtotal bigint,coupon_discount bigint);");
await p.exec(fs.readFileSync('supabase/18-coupon-quotas.sql','utf8'));const sql=fs.readFileSync('supabase/19-special-coupons.sql','utf8');await p.exec(sql);
await p.exec("INSERT INTO coupons(code,kind,value,scope,max_uses) VALUES('SALE5','percent',500,'regular',5),('EXTRA3','percent',300,'special',1),('OTHER','fixed',100,'special',10)");
async function order(id,regular='SALE5',special='EXTRA3',discount=7850,extra=2850,subtotal=92150){return p.query("INSERT INTO orders(id,coupon_code,member_id,created,subtotal,coupon_discount,special_code,special_discount) VALUES($1,$2,'member','2026-09-08',$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING",[id,regular,subtotal,discount,special,extra])}
await order('one');await order('one');assert.equal((await p.query("SELECT * FROM coupon_redemptions WHERE order_id='one'")).rows.length,2);
await assert.rejects(order('two'),/สิทธิ์เต็ม/);assert.equal(Number((await p.query("SELECT used_total FROM coupons WHERE code='SALE5'")).rows[0].used_total),1,'first quota rolls back when special exhausted');
await assert.rejects(order('wrong','EXTRA3','OTHER'),/ผิดช่อง/);
await assert.rejects(order('stale','SALE5','OTHER'),/เปลี่ยนแล้ว/);
await order('normal','SALE5','',5000,0,95000);
await order('special','','OTHER',100,100,99900);
await p.exec(sql);assert.equal((await p.query("SELECT * FROM coupon_redemptions WHERE order_id='one'")).rows.length,2);
await p.exec("DELETE FROM orders WHERE id='one'");assert.equal(Number((await p.query("SELECT used_total FROM coupons WHERE code='EXTRA3'")).rows[0].used_total),1);
await p.close();console.log('PASS sequential discounts, cap/threshold, 2 ledger entries, retry idempotence, quota rollback, scope enforcement, stale amount, single code modes, migration rerun, deletion retains quota');
})().catch(e=>{console.error(e);process.exit(1)});
