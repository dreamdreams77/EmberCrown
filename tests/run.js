#!/usr/bin/env node
/* Reproducible test runner: node tests/run.js [name ...]
   Serves the repo on EC_PORT (default 8123), runs each *.test.js in a temp copy with the port rewritten,
   prints PASS/FAIL per suite and exits non-zero on any failure. Needs `npm install` (playwright) once. */
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),{spawnSync,spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),PORT=+process.env.EC_PORT||8123;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
srv.listen(PORT,()=>{
  let fails=0;
  for(const f of fs.readdirSync(ROOT+'/js'))if(spawnSync('node',['--check',path.join(ROOT,'js',f)]).status){console.log('FAIL syntax js/'+f);fails++;}
  if(!fails)console.log('PASS syntax');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ec_'));
  const want=process.argv.slice(2);
  const files=fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')&&(!want.length||want.some(w=>f.startsWith(w))));
  for(const f of fs.readdirSync(__dirname))if(f.endsWith('.js')&&f!=='run.js'){
    fs.writeFileSync(path.join(tmp,f),fs.readFileSync(path.join(__dirname,f),'utf8').replace(/localhost:8123/g,'localhost:'+PORT));}
  const env=Object.assign({},process.env,{NODE_PATH:[path.join(ROOT,'node_modules'),process.env.NODE_PATH||''].join(path.delimiter),EC_ROOT:ROOT,EC_OUT:tmp});
  const runOne=f=>new Promise(res=>{
    const ch=spawn('node',[path.join(tmp,f)],{cwd:tmp,env});let out='';
    const kill=setTimeout(()=>ch.kill('SIGKILL'),300000);
    ch.stdout.on('data',d=>out+=d);ch.stderr.on('data',d=>out+=d);
    ch.on('close',code=>{clearTimeout(kill);res({code,out});});});
  (async()=>{
    for(const f of files){
      const {code,out}=await runOne(f);
      const bad=code!==0||/PAGEERR|Error|FAIL/.test(out);
      console.log((bad?'FAIL ':'PASS ')+f.replace('.test.js',''));if(bad){fails++;console.log(out.split('\n').slice(-14).join('\n'));}
    }
    console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');srv.close();process.exit(fails?1:0);
  })();
});
