"use strict";
const assert=require("node:assert/strict");
const http=require("node:http");
const zlib=require("node:zlib");
const label=process.argv[2];assert.ok(label==="original"||label==="patched");
const MAX=8*1024*1024, PRIVATE="PRIVATE_104f", KEY="synthetic-provider-key";
const normal='{"synthetic":true}', atLimit='"'+"x".repeat(MAX-2)+'"', large='"'+"x".repeat(MAX+1)+'"';
const gzipLarge=zlib.gzipSync(large);let phase="normal",sinkRequests=0,seen=[];
const listen=server=>new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});
async function main(){
  const sink=http.createServer((req,res)=>{sinkRequests++;res.setHeader("Content-Type","application/json");res.end(normal);});await listen(sink);
  const provider=http.createServer((req,res)=>{
    const chunks=[];req.on("data",b=>chunks.push(b));req.on("end",()=>{
      seen.push({url:req.url,method:req.method,authorization:req.headers.authorization,body:Buffer.concat(chunks).toString()});
      res.setHeader("Content-Type","application/json");
      if(phase==="private_error"){res.statusCode=500;res.end(PRIVATE);return;}
      if(phase==="invalid_json"){res.end(PRIVATE);return;}
      if(phase==="declared_large"){res.setHeader("Content-Length",Buffer.byteLength(large));res.end(large);return;}
      if(phase==="chunked_large"){res.write(large.slice(0,1024));res.end(large.slice(1024));return;}
      if(phase==="gzip_large"){res.setHeader("Content-Encoding","gzip");res.setHeader("Content-Length",gzipLarge.length);res.end(gzipLarge);return;}
      if(phase==="redirect"){res.statusCode=302;res.setHeader("Location",`http://127.0.0.1:${sink.address().port}/sink`);res.end();return;}
      if(phase==="headers_deadline"){setTimeout(()=>res.end(normal),250);return;}
      if(phase==="body_deadline"){res.write('{"synthetic":');setTimeout(()=>res.end('true}'),250);return;}
      if(phase==="null_json"){res.end("null");return;}
      if(phase==="at_limit"){res.end(atLimit);return;}
      if(phase==="chunked_json"){res.write('{"synthetic":');res.end('true}');return;}
      res.end(normal);
    });
  });await listen(provider);
  process.env.BUILT_IN_FORGE_API_URL=`http://127.0.0.1:${provider.address().port}`;process.env.BUILT_IN_FORGE_API_KEY=KEY;
  const modules=label==="original"?{maps:require("../../PROVIDER_RESPONSE_EVIDENCE/original-map.cjs"),llm:require("../../PROVIDER_RESPONSE_EVIDENCE/original-llm.cjs")}:{maps:require("../../PROVIDER_RESPONSE_EVIDENCE/patched-map.cjs"),llm:require("../../PROVIDER_RESPONSE_EVIDENCE/patched-llm.cjs")};
  const adapters={maps:()=>modules.maps.makeRequest("/maps/api/geocode/json",{address:"synthetic public query"},{method:"POST",body:{synthetic:true}}),llm:()=>modules.llm.invokeLLM({messages:[{role:"user",content:"synthetic public query"}]})};
  const rows=[];
  try {
    for(const [adapter,invoke] of Object.entries(adapters))for(const mode of ["normal","null_json","chunked_json","at_limit","private_error","invalid_json","declared_large","chunked_large","gzip_large","redirect","headers_deadline","body_deadline"]){
      phase=mode;seen=[];sinkRequests=0;const originalTimeout=AbortSignal.timeout;let deadlineCalls=0;
      try {
        if(mode.endsWith("_deadline"))AbortSignal.timeout=function(ms){assert.equal(ms,30000);deadlineCalls++;return originalTimeout.call(AbortSignal,50);};
        if(["normal","chunked_json"].includes(mode)){
          assert.deepEqual(await invoke(),{synthetic:true});assert.equal(seen.length,1);assert.equal(seen[0].method,"POST");
          if(adapter==="maps"){assert.equal(new URL(seen[0].url,"http://synthetic.invalid").searchParams.get("key"),KEY);assert.deepEqual(JSON.parse(seen[0].body),{synthetic:true});}
          else {assert.equal(seen[0].authorization,`Bearer ${KEY}`);assert.deepEqual(JSON.parse(seen[0].body).messages,[{role:"user",content:"synthetic public query"}]);}
        }else if(mode==="null_json")assert.equal(await invoke(),null);
        else if(mode==="at_limit"){const result=await invoke();assert.equal(typeof result,"string");assert.equal(result.length,MAX-2);}
        else if(mode==="private_error")await assert.rejects(invoke,err=>!err.message.includes(PRIVATE)&&err.message.includes("HTTP 500"));
        else if(mode==="invalid_json")await assert.rejects(invoke,err=>!err.message.includes(PRIVATE)&&err.message.includes("invalid JSON"));
        else if(mode.endsWith("large"))await assert.rejects(invoke,/response exceeds the 8388608-byte limit/);
        else if(mode==="redirect"){await assert.rejects(invoke,/request could not be completed/);assert.equal(sinkRequests,0);}
        else {await assert.rejects(invoke,/request could not be completed/);assert.equal(deadlineCalls,1);}
        rows.push({name:adapter+"_"+mode,status:"passed"});
      }catch(error){rows.push({name:adapter+"_"+mode,status:"failed",type:error.name,message:error.message});}
      finally {AbortSignal.timeout=originalTimeout;}
    }
  }finally {await close(provider);await close(sink);}
  const report={node:process.version,cases:rows.length,passed:rows.filter(r=>r.status==="passed").length,failed:rows.filter(r=>r.status==="failed").length,skipped:0,results:rows};
  console.log(JSON.stringify(report));process.exitCode=report.failed?1:0;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
