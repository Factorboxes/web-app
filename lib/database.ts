import 'server-only';
import {Pool,types,type PoolClient} from 'pg';
types.setTypeParser(20,value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw Error('Amount outside supported range');return n});
types.setTypeParser(1700,value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw Error('Amount outside supported range');return n});
let pool:Pool;
function connection(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is missing');return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:20000,connectionTimeoutMillis:10000})}
function parameters(sql:string){let n=0,quoted=false;let result='';for(let i=0;i<sql.length;i++){const ch=sql[i];if(ch==="'"){if(quoted&&sql[i+1]==="'"){result+="''";i++;continue}quoted=!quoted}result+=ch==='?'&&!quoted?'$'+(++n):ch}return result}
class Statement{constructor(readonly sql:string,readonly values:unknown[]=[]){ }bind(...values:unknown[]){return new Statement(this.sql,values)}async execute(client?:PoolClient){return (client||connection()).query(parameters(this.sql),this.values)}async all(){const r=await this.execute();return {results:r.rows}}async first<T=Record<string,any>>():Promise<T|null>{const r=await this.execute();return r.rows[0]??null}async run(){const r=await this.execute();return {meta:{changes:r.rowCount??0}}}}
export const database={prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){const client=await connection().connect();try{await client.query('BEGIN');const results=[];for(const s of statements)results.push(await s.execute(client));await client.query('COMMIT');return results}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}};
