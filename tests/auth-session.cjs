const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {NextRequest,NextResponse}=require('next/server');
function load(file,modules={}){const e={};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(e,key=>modules[key]||require(key));return e}
(async()=>{
 const session=load('lib/supabase/session.ts');
 const opts={path:'/',sameSite:'lax',maxAge:400*86400};
 assert.equal(session.sessionCookieOptions(opts,true,true).maxAge,30*86400);
 assert.equal(session.sessionCookieOptions({...opts,expires:new Date()},false,true).maxAge,undefined);
 assert.equal(session.sessionCookieOptions({...opts,expires:new Date()},false,true).expires,undefined);
 for(const remember of [true,false])assert.equal(session.sessionCookieOptions({...opts,maxAge:0},remember,true).maxAge,0,'Logout/chunk deletion must remain deletion');
 assert.equal(session.sessionCookieOptions(opts,true,true).secure,true);assert.equal(session.sessionCookieOptions(opts,true,false).secure,false);
 for(const path of [null,'https://evil.test','//evil.test','/\\evil.test','/\nevil.test','/','/login','/auth/signout'])assert.equal(session.loginDestination(path),'/store');
 assert.equal(session.loginDestination('/account/orders/abc?x=1'),'/account/orders/abc?x=1');assert.equal(session.loginDestination('/admin'),'/admin');
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://local-test.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='local-placeholder';
 let user=null,error=null,writes=[];
 const sdk={createServerClient(_url,_key,options){return {auth:{async getUser(){if(writes.length)options.cookies.setAll(writes,{'Cache-Control':'private, no-store'});return {data:{user},error}}}}}};
 const {proxy}=load('proxy.ts',{'@supabase/ssr':sdk,'@/lib/supabase/session':session,'next/server':{NextRequest,NextResponse}});
 const req=(path='/',pref)=>new NextRequest('https://shop.test'+path,{headers:pref?{cookie:session.REMEMBER_COOKIE+'='+pref}:{}});
 let response=await proxy(req());assert.equal(response.headers.get('location'),null);assert.equal(response.headers.get('cache-control'),'private, no-store');
 user={id:'customer',email_confirmed_at:'2026-09-01'};
 assert.equal((await proxy(req())).headers.get('location'),'https://shop.test/store');
 assert.equal((await proxy(req('/?gclid=click123&gbraid=braid456&secret=omit'))).headers.get('location'),'https://shop.test/store?gclid=click123&gbraid=braid456');
 assert.equal((await proxy(req('/login?next=%2Faccount%2Forders'))).headers.get('location'),'https://shop.test/account/orders');
 for(const path of ['/store','/login?mode=password','/login?mode=reset','/login?mode=signup'])assert.equal((await proxy(req(path))).headers.get('location'),null,'Preserve auth recovery pages and store');
 user={id:'unconfirmed'};assert.equal((await proxy(req())).headers.get('location'),null);
 user={id:'customer',email_confirmed_at:'2026-09-01'};error={message:'Invalid session'};assert.equal((await proxy(req())).headers.get('location'),null,'Only verified sessions can skip login');error=null;
 writes=[{name:'sb-test-auth-token',value:'new-token',options:opts},{name:'sb-test-auth-token.0',value:'',options:{...opts,maxAge:0}}];
 for(const pref of ['remember','session',undefined]){
  response=await proxy(req('/',pref));const token=response.cookies.get('sb-test-auth-token');
  assert.equal(response.headers.get('location'),'https://shop.test/store');
  assert.equal(token.value,'new-token','Refreshed token survives redirect response');
  assert.equal(token.maxAge,pref==='session'?undefined:30*86400,'Server refresh respects opt-out');
  assert.equal(response.cookies.get('sb-test-auth-token.0').maxAge,0,'Old chunk removed on redirect');
  assert.match(response.headers.get('cache-control'),/private.*no-store/);
 }
 // Server action/callback writes must follow the same policy as proxy refresh.
 for(const pref of ['remember','session']){
  const jar=new Map([[session.REMEMBER_COOKIE,{value:pref}]]);
  const server=load('lib/supabase/server.ts',{'server-only':{},'@supabase/ssr':sdk,'./session':session,'next/headers':{cookies:async()=>({getAll:()=>[],get:name=>jar.get(name),set:(name,value,options)=>jar.set(name,{value,...options})})}});
  await (await server.authClient()).auth.getUser();assert.equal(jar.get('sb-test-auth-token').maxAge,pref==='session'?undefined:30*86400);assert.equal(jar.get('sb-test-auth-token.0').maxAge,0);
 }
 console.log('PASS auth session: 30-day persistence, session opt-out, refreshed cookies on redirect, logout deletion, verified-user-only resume, safe redirect destinations, recovery/signup routes and no-store caching.');
})().catch(e=>{console.error(e);process.exit(1)});
