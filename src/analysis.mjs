export const releases = {
  'v2.5.0': {
    version:'v2.5.0', deployedAt:'2026-08-15T09:42:00Z', commit:'8f31c2a', deploy:'SUCCESS',
    spans:[
      {id:'root',name:'GET /checkout',service:'edge',parent:null,start:0,duration:892,status:'ok'},
      {id:'session',name:'session.validate',service:'edge',parent:'root',start:20,duration:74,status:'ok'},
      {id:'cart',name:'cart.read',service:'api',parent:'root',start:112,duration:168,status:'ok'},
      {id:'pricing',name:'pricing.quote',service:'api',parent:'root',start:304,duration:96,status:'ok'},
      {id:'inventory',name:'inventory.reserve',service:'api',parent:'root',start:418,duration:121,status:'ok'},
      {id:'payments',name:'payments.authorize',service:'api',parent:'root',start:568,duration:271,status:'error',error:'upstream timeout · retry budget exhausted'},
      {id:'ledger',name:'ledger.append',service:'db',parent:'payments',start:612,duration:38,status:'skipped'}
    ],
    files:[
      {path:'services/payments/authorize.ts',owner:'payments',coverage:61,changed:true,tests:['payments.authorize.contract']},
      {path:'services/cart/read.ts',owner:'checkout',coverage:94,changed:false,tests:['checkout.smoke','cart.read.unit']},
      {path:'services/pricing/quote.ts',owner:'pricing',coverage:89,changed:true,tests:['pricing.contract']},
      {path:'infra/timeouts.yaml',owner:'platform',coverage:100,changed:true,tests:['runtime.budget']}
    ],
    tests:[{name:'checkout.smoke',status:'pass',duration:282},{name:'payments.authorize.contract',status:'fail',duration:913},{name:'pricing.contract',status:'pass',duration:44},{name:'runtime.budget',status:'pass',duration:8}]
  },
  'v2.4.3': {
    version:'v2.4.3', deployedAt:'2026-08-10T14:18:00Z', commit:'4cb918e', deploy:'SUCCESS',
    spans:[
      {id:'root',name:'GET /checkout',service:'edge',parent:null,start:0,duration:476,status:'ok'},
      {id:'session',name:'session.validate',service:'edge',parent:'root',start:18,duration:61,status:'ok'},
      {id:'cart',name:'cart.read',service:'api',parent:'root',start:98,duration:106,status:'ok'},
      {id:'pricing',name:'pricing.quote',service:'api',parent:'root',start:227,duration:72,status:'ok'},
      {id:'inventory',name:'inventory.reserve',service:'api',parent:'root',start:319,duration:88,status:'ok'},
      {id:'payments',name:'payments.authorize',service:'api',parent:'root',start:424,duration:42,status:'ok'},
      {id:'ledger',name:'ledger.append',service:'db',parent:'payments',start:438,duration:31,status:'ok'}
    ],
    files:[{path:'services/payments/authorize.ts',owner:'payments',coverage:86,changed:false,tests:['payments.authorize.contract']},{path:'services/cart/read.ts',owner:'checkout',coverage:94,changed:false,tests:['checkout.smoke','cart.read.unit']},{path:'services/pricing/quote.ts',owner:'pricing',coverage:89,changed:false,tests:['pricing.contract']}],
    tests:[{name:'checkout.smoke',status:'pass',duration:194},{name:'payments.authorize.contract',status:'pass',duration:208},{name:'pricing.contract',status:'pass',duration:40}]
  }
};

function children(spans) { return Object.fromEntries(spans.map((span) => [span.id, spans.filter((item) => item.parent === span.id)])); }
function intervalLength(intervals) { const sorted = intervals.filter(Boolean).sort((a,b)=>a[0]-b[0]); let total=0,end=-Infinity; for (const [start,finish] of sorted) if (finish>end) { total += Math.max(0,finish-Math.max(start,end)); end=finish; } return total; }
function pathFor(span,map,memo=new Map(),weights=new Map()) { if(memo.has(span.id)) return memo.get(span.id); const kids=map[span.id]||[]; const tail=kids.length?Math.max(...kids.map((child)=>pathFor(child,map,memo,weights))):0; const result=(weights.get(span.id)??span.duration)+tail; memo.set(span.id,result); return result; }
function validateSpans(spans) { if(!Array.isArray(spans)||spans.length<1||spans.length>1000) throw new Error('spans must contain between 1 and 1000 items'); const ids=new Set(); for(const span of spans){if(!span?.id||ids.has(span.id)) throw new Error('span ids must be unique'); if(!Number.isFinite(Number(span.duration))||Number(span.duration)<0) throw new Error(`invalid duration for ${span.id}`); ids.add(span.id);} for(const span of spans) if(span.parent&&!ids.has(span.parent)) throw new Error(`orphan parent ${span.parent} referenced by ${span.id}`); const byId=new Map(spans.map((span)=>[span.id,span])),visiting=new Set(),visited=new Set(); function visit(id){if(visiting.has(id)) throw new Error(`cycle detected at ${id}`);if(visited.has(id))return;visiting.add(id);const parent=byId.get(id)?.parent;if(parent)visit(parent);visiting.delete(id);visited.add(id);} spans.forEach((span)=>visit(span.id)); return { roots:spans.filter((span)=>!span.parent) }; }
export function criticalPath(spans) { const {roots}=validateSpans(spans); const map=children(spans),weights=new Map(); for(const span of spans){const kids=map[span.id]||[],start=Number(span.start||0),finish=start+Number(span.duration),windows=kids.map((kid)=>[Number(kid.start||0),Number(kid.start||0)+Number(kid.duration)]).filter(([a,b])=>a>=start&&b<=finish);weights.set(span.id,Math.max(0,Number(span.duration)-intervalLength(windows)));} const memo=new Map(),value=(root)=>pathFor(root,map,memo,weights),root=roots.sort((a,b)=>value(b)-value(a))[0],chain=[];let current=root;while(current){chain.push(current.id);const kids=map[current.id]||[];current=kids.sort((a,b)=>pathFor(b,map,memo,weights)-pathFor(a,map,memo,weights))[0];}return {duration:value(root),spanIds:chain,roots:roots.map((item)=>item.id),exclusive:true}; }
export function analyzeTrace(payload = {}) {
  const spans = payload.spans || payload.trace?.spans;
  validateSpans(spans);
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  const files = (Array.isArray(payload.files) ? payload.files : []).map((file, index) => ({
    path: String(file?.path || `unknown-${index + 1}`),
    owner: String(file?.owner || 'unowned'),
    coverage: Math.min(100, Math.max(0, Number(file?.coverage) || 0)),
    changed: file?.changed === true,
    tests: Array.isArray(file?.tests) ? file.tests.map(String) : []
  }));
  const tests = (Array.isArray(payload.tests) ? payload.tests : []).map((item, index) => ({
    name: String(item?.name || `test-${index + 1}`),
    status: item?.status === 'fail' ? 'fail' : 'pass',
    duration: Math.max(0, Number(item?.duration) || 0)
  }));
  return { ...metadata, ...payload, spans, files, tests };
}
export function analyze(release) {
  const normalized=analyzeTrace(release); const path = criticalPath(normalized.spans); const failed = normalized.spans.filter((span) => span.status === 'error'); const changed = (normalized.files||[]).filter((file) => file.changed); const gaps = changed.filter((file) => file.coverage < 80); const failedTests = (normalized.tests||[]).filter((test) => test.status === 'fail');
  const risk = Math.min(100, Math.round((failed.length ? 46 : 0) + Math.min(28, path.duration / 30) + gaps.reduce((sum,file) => sum + (80-file.coverage) / 3,0) + failedTests.length * 18));
  const positions = {}; const layers = {}; normalized.spans.forEach((span) => { let depth=0, p=span.parent; while(p){depth++;p=normalized.spans.find((s)=>s.id===p)?.parent;} (layers[depth] ||= []).push(span); }); Object.entries(layers).forEach(([depth,items]) => items.forEach((span,index) => { positions[span.id] = {x:120 + Number(depth)*190,y:85 + index*88,depth}; }));
  const impactedFiles = failed.flatMap((span) => (normalized.files||[]).filter((file) => file.path.includes(span.service) || file.owner === span.service)).concat(gaps).filter((file,index,array)=>array.findIndex((item)=>item.path===file.path)===index);
  return { release:normalized.version, deployedAt:normalized.deployedAt, commit:normalized.commit, deploy:normalized.deploy, spans:normalized.spans, files:normalized.files||[], tests:normalized.tests||[], criticalPath:path, failed, impactedFiles, failedTests, risk, positions };
}
function averageCoverage(files) { return files.length ? files.reduce((sum, file) => sum + file.coverage, 0) / files.length : 0; }
export function compare(current, previous) { const a=analyze(current), b=analyze(previous); return { latencyDelta:a.criticalPath.duration-b.criticalPath.duration, riskDelta:a.risk-b.risk, coverageDelta:Math.round(averageCoverage(a.files)-averageCoverage(b.files)), failedTestsDelta:a.failedTests.length-b.failedTests.length, current:a.release, previous:b.release }; }
