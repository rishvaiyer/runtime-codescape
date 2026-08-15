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
function pathFor(span, map, memo = new Map()) { if (memo.has(span.id)) return memo.get(span.id); const kids = map[span.id] || []; const tail = kids.length ? Math.max(...kids.map((child) => pathFor(child, map, memo))) : 0; const result = span.duration + tail; memo.set(span.id, result); return result; }
export function criticalPath(spans) { const map = children(spans); const memo = new Map(); const root = spans.find((span) => !span.parent) || spans[0]; const chain = []; let current = root; while (current) { chain.push(current.id); const kids = map[current.id] || []; current = kids.sort((a,b) => pathFor(b,map,memo)-pathFor(a,map,memo))[0]; } return { duration:pathFor(root,map,memo), spanIds:chain }; }
export function analyze(release) {
  const path = criticalPath(release.spans); const failed = release.spans.filter((span) => span.status === 'error'); const changed = release.files.filter((file) => file.changed); const gaps = changed.filter((file) => file.coverage < 80); const failedTests = release.tests.filter((test) => test.status === 'fail');
  const risk = Math.min(100, Math.round((failed.length ? 46 : 0) + Math.min(28, path.duration / 30) + gaps.reduce((sum,file) => sum + (80-file.coverage) / 3,0) + failedTests.length * 18));
  const positions = {}; const layers = {}; release.spans.forEach((span) => { let depth=0, p=span.parent; while(p){depth++;p=release.spans.find((s)=>s.id===p)?.parent;} (layers[depth] ||= []).push(span); }); Object.entries(layers).forEach(([depth,items]) => items.forEach((span,index) => { positions[span.id] = {x:120 + Number(depth)*190,y:85 + index*88,depth}; }));
  const impactedFiles = failed.flatMap((span) => release.files.filter((file) => file.path.includes(span.service) || file.owner === span.service)).concat(gaps).filter((file,index,array)=>array.findIndex((item)=>item.path===file.path)===index);
  return { release:release.version, deployedAt:release.deployedAt, commit:release.commit, deploy:release.deploy, spans:release.spans, files:release.files, tests:release.tests, criticalPath:path, failed, impactedFiles, failedTests, risk, positions };
}
export function compare(current, previous) { const a=analyze(current), b=analyze(previous); return { latencyDelta:a.criticalPath.duration-b.criticalPath.duration, riskDelta:a.risk-b.risk, coverageDelta:Math.round((a.files.reduce((s,f)=>s+f.coverage,0)/a.files.length)-(b.files.reduce((s,f)=>s+f.coverage,0)/b.files.length)), failedTestsDelta:a.failedTests.length-b.failedTests.length, current:a.release, previous:b.release }; }
