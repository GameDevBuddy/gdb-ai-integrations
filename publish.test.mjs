import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,verify} from 'node:crypto';
import {execFileSync} from 'node:child_process';
test('publisher signs a verifiable catalogue and rejects wrong release key',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gdb-catalogue-'));
 try{
 for(const file of ['publish.mjs','package-ai-integration.mjs','profiles'])await cp(file,join(dir,file),{recursive:true});
 const {privateKey,publicKey}=generateKeyPairSync('ed25519');
 await writeFile(join(dir,'publisher.json'),JSON.stringify({publisher:'GameDevBuddy',publicKey:Buffer.from(publicKey.export({format:'jwk'}).x,'base64url').toString('base64')}));
 const env={...process.env,AI_INTEGRATION_SIGNING_KEY:privateKey.export({format:'pem',type:'pkcs8'})};
 execFileSync(process.execPath,['publish.mjs'],{cwd:dir,env});
 const cat=JSON.parse(await readFile(join(dir,'dist/catalogue.json')));assert.equal(cat.packages.length,2);
 for(const url of cat.packages){const p=JSON.parse(await readFile(join(dir,'dist/packages',url.split('/').pop())));assert.equal(p.publisher,'GameDevBuddy');assert(verify(null,Buffer.from(p.payload,'base64'),publicKey,Buffer.from(p.signature,'base64')));}
 await writeFile(join(dir,'publisher.json'),JSON.stringify({publisher:'GameDevBuddy',publicKey:'wrong'}));
 assert.throws(()=>execFileSync(process.execPath,['publish.mjs'],{cwd:dir,env,stdio:'pipe'}));
 }finally{await rm(dir,{recursive:true,force:true});}
});
