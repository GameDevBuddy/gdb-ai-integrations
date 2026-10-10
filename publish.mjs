import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {packageIntegration} from './package-ai-integration.mjs';
const root='https://raw.githubusercontent.com/GameDevBuddy/gdb-ai-integrations/published';
const publisher='GameDevBuddy';
const pem=process.env.AI_INTEGRATION_SIGNING_KEY;
if(!pem)throw Error('Signing key is not configured');
await mkdir('dist/packages',{recursive:true});
const files=(await readdir('profiles')).filter(f=>f.endsWith('.json')).sort();
if(!files.length||files.length>16)throw Error('Catalogue requires 1–16 profiles');
const packages=[];const ids=new Set();let publicKey;
for(const file of files){
 const profile=JSON.parse(await readFile('profiles/'+file,'utf8'));
 if(ids.has(profile.id))throw Error('Duplicate integration ID'); ids.add(profile.id);
 const result=packageIntegration(profile,publisher,pem);
 publicKey=result.publicKey;
 await writeFile('dist/packages/'+profile.id+'.json',JSON.stringify(result.envelope,null,2)+'\n');
 packages.push(root+'/packages/'+profile.id+'.json');
}
const expected=JSON.parse(await readFile('publisher.json','utf8'));
if(publicKey!==expected.publicKey||publisher!==expected.publisher)throw Error('Signing key does not match the pinned publisher');
await writeFile('dist/catalogue.json',JSON.stringify({schemaVersion:1,packages},null,2)+'\n');
await writeFile('dist/publisher.json',JSON.stringify(expected,null,2)+'\n');
console.log('Verified and signed '+packages.length+' integration profiles.');
