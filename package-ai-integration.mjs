import { readFile, writeFile } from "node:fs/promises";
import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { pathToFileURL } from "node:url";

export function packageIntegration(profile, publisher, privatePem) {
  if (!publisher?.trim() || publisher.length > 100) throw new Error("Provide a publisher name");
  const {id,name,version,protocol,defaultEndpoint,capabilities} = profile;
  const supported = {openai:["chat","embeddings"],ollama:["chat","embeddings"],anthropic:["chat"],mcp:["tools"],tripo:["generate-3d"]};
  if (!/^[A-Za-z0-9.-]{1,100}$/.test(id ?? "") || ["ollama","lm-studio","openai","openai-compatible","anthropic","mcp","tripo"].includes(id)) throw new Error("Invalid or reserved integration ID");
  if (!name?.trim() || name.length > 100 || !/^\d+\.\d+\.\d+$/.test(version ?? "")) throw new Error("Provide a name and major.minor.patch version");
  const endpoint = new URL(defaultEndpoint);
  if (!["http:","https:"].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error("Invalid provider endpoint");
  if (!Array.isArray(capabilities) || !capabilities.length || capabilities.some(c => !supported[protocol]?.includes(c))) throw new Error("Unsupported capabilities");
  const key = createPrivateKey(privatePem);
  if (key.asymmetricKeyType !== "ed25519") throw new Error("Use an Ed25519 signing key");
  const payload = Buffer.from(JSON.stringify({schemaVersion:1,hostApi:1,integration:{id,name,version,protocol,defaultEndpoint,capabilities}}));
  const publicKey = createPublicKey(key).export({format:"jwk"});
  return {envelope:{publisher,payload:payload.toString("base64"),signature:sign(null,payload,key).toString("base64")},publicKey:Buffer.from(publicKey.x,"base64url").toString("base64")};
}
async function main() {
  const [profilePath,publisher,keyPath,outputPath] = process.argv.slice(2);
  if (!outputPath) throw new Error("Usage: node scripts/package-ai-integration.mjs profile.json Publisher signing-key.pem output.json");
  const result = packageIntegration(JSON.parse(await readFile(profilePath,"utf8")),publisher,await readFile(keyPath,"utf8"));
  await writeFile(outputPath,JSON.stringify(result.envelope,null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify({output:outputPath,publisher,publicKey:result.publicKey}));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e=>{console.error(e.message);process.exitCode=1;});
