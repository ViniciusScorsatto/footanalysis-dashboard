import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {fetchLogo, logoUrl, publicIPv4, imageExtension} from '../scripts/lib/safe-logo.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5mQAAAAASUVORK5CYII=','base64');
const url='https://media.api-sports.io/football/teams/33.png';
const lookupImpl=async()=>[{address:'8.8.8.8',family:4}];
function transport(responses, observed=[]) {
  return (url, options, callback) => {
    observed.push({url:String(url),options});
    const req=new EventEmitter();
    const res=new PassThrough();
    const next=responses.shift();
    const abort=()=>{res.destroy();req.emit('error',new Error('aborted'));};
    options.signal.addEventListener('abort',abort,{once:true});
    res.once('close',()=>options.signal.removeEventListener('abort',abort));
    queueMicrotask(()=>{
      res.statusCode=next.status??200;res.headers=next.headers??{'content-type':'image/png'};
      callback(res);
      if(!next.stall) {for(const chunk of next.chunks??[png])res.write(chunk);res.end();}
    });
    return req;
  };
}
test('logo URL allowlist rejects credentials, ports, suffix tricks, IPs and non-HTTPS',()=>{
  assert.equal(logoUrl(url).hostname,'media.api-sports.io');
  for(const u of ['http://media.api-sports.io/a','https://media.api-sports.io.evil.test/a','https://evil.test/a','https://127.0.0.1/a','https://[::1]/a','https://media.api-sports.io:8080/a','https://u:p@media.api-sports.io/a','file:///etc/passwd']) assert.throws(()=>logoUrl(u));
});
test('logo resolver rejects private, metadata, reserved and IPv6 destinations',async()=>{
  for(const address of ['0.0.0.0','10.1.2.3','127.0.0.1','169.254.169.254','100.64.0.1','172.16.0.1','192.168.1.1','192.0.0.1','192.0.2.1','198.18.0.1','198.51.100.1','203.0.113.1','224.0.0.1','255.255.255.255','::1','::ffff:127.0.0.1']) {
    assert.equal(publicIPv4(address),false,address);
    await assert.rejects(fetchLogo(url,{lookupImpl:async()=>[{address}],requestImpl:()=>assert.fail('must not connect')}),/ADDRESS_BLOCKED/);
  }
  await assert.rejects(fetchLogo(url,{lookupImpl:async()=>[{address:'8.8.8.8'},{address:'10.0.0.1'}]}),/ADDRESS_BLOCKED/);
});
test('verified DNS is pinned on each connection, raster bytes and relative redirects work',async()=>{
  const observed=[];
  const result=await fetchLogo(url,{lookupImpl,requestImpl:transport([{status:302,headers:{location:'/next.png'}},{}],observed)});
  assert.deepEqual(result,{bytes:png,extension:'.png'});
  assert.equal(observed.length,2);assert.equal(observed[1].url,'https://media.api-sports.io/next.png');
  for(const {options} of observed) {
    assert.equal(options.agent,false);assert.equal(options.family,4);
    options.lookup('media.api-sports.io',{},(error,address,family)=>{assert.equal(error,null);assert.equal(address,'8.8.8.8');assert.equal(family,4);});
    options.lookup('media.api-sports.io',{all:true},(error,records)=>{assert.equal(error,null);assert.deepEqual(records,[{address:'8.8.8.8',family:4}]);});
  }
});
test('redirects cannot escape allowlist or exceed the hop budget',async()=>{
  for(const location of ['https://127.0.0.1/private','http://media.api-sports.io/a','https://evil.test/a']) await assert.rejects(fetchLogo(url,{lookupImpl,requestImpl:transport([{status:302,headers:{location}}])}),/DESTINATION_BLOCKED/);
  await assert.rejects(fetchLogo(url,{lookupImpl,requestImpl:transport(Array.from({length:3},()=>({status:302,headers:{location:'/loop'}})))}),/REDIRECT_BLOCKED/);
  let count=0;
  await assert.rejects(fetchLogo(url,{lookupImpl:async()=>[{address:count++?'10.0.0.1':'8.8.8.8'}],requestImpl:transport([{status:302,headers:{location:'/next'}}])}),/ADDRESS_BLOCKED/);
});
test('reject oversized, streamed, encoded or non-raster payloads and preserve 404 fallback',async()=>{
  for(const response of [
    {headers:{'content-length':'9999999','content-type':'image/png'}},
    {chunks:[png,png],headers:{'content-type':'image/png'}},
    {headers:{'content-encoding':'gzip','content-type':'image/png'}},
    {chunks:[Buffer.from('<svg onload="alert(1)"></svg>')],headers:{'content-type':'image/svg+xml'}},
    {chunks:[Buffer.from('<html>not an image</html>')],headers:{'content-type':'image/png'}},
  ]) await assert.rejects(fetchLogo(url,{lookupImpl,maxBytes:png.length,requestImpl:transport([response])}));
  assert.equal(await fetchLogo(url,{lookupImpl,requestImpl:transport([{status:404}])}),undefined);
  assert.throws(()=>imageExtension(png,'text/html'));
});
test('total deadline includes DNS and stalled response bodies',async()=>{
  await assert.rejects(fetchLogo(url,{timeoutMs:20,lookupImpl:()=>new Promise(()=>{})}),/TIMEOUT/);
  await assert.rejects(fetchLogo(url,{timeoutMs:20,lookupImpl,requestImpl:transport([{stall:true}])}),/aborted/);
});
