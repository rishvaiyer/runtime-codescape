const nodes = [
  { id:'edge', label:'edge-router', x:78, y:210, kind:'healthy', meta:'12 ms' },
  { id:'checkout', label:'checkout-api', x:258, y:210, kind:'healthy', meta:'88 ms' },
  { id:'pricing', label:'pricing.quote', x:450, y:110, kind:'healthy', meta:'124 ms' },
  { id:'inventory', label:'inventory.reserve', x:450, y:310, kind:'fail', meta:'612 ms' },
  { id:'payment', label:'payment.authorize', x:650, y:210, kind:'healthy', meta:'—' },
  { id:'response', label:'response', x:822, y:210, kind:'fail', meta:'842 ms' }
];
const edges = [['edge','checkout'],['checkout','pricing'],['checkout','inventory'],['pricing','payment'],['inventory','payment'],['payment','response']];
const svg = document.querySelector('#graph');
const nodeMap = Object.fromEntries(nodes.map(n => [n.id,n]));
svg.innerHTML = edges.map(([a,b]) => { const A=nodeMap[a],B=nodeMap[b]; const critical = a==='checkout'||a==='inventory'||a==='payment'; return `<path class="edge ${critical?'critical':''}" d="M ${A.x+70} ${A.y} C ${(A.x+B.x)/2} ${A.y}, ${(A.x+B.x)/2} ${B.y}, ${B.x-12} ${B.y}"/>`; }).join('') + nodes.map(n => `<g class="node ${n.kind}" tabindex="0" data-node="${n.id}" transform="translate(${n.x} ${n.y})"><rect x="-70" y="-28" width="140" height="56" rx="12"/><circle class="node-dot" cx="-53" cy="-10" r="4"/><text x="-42" y="-6">${n.label}</text><text class="node-meta" x="-42" y="14">${n.meta}</text></g>`).join('');
const risks = [
  ['src/inventory/reserve.js','Fulfillment','retry policy · blame','61%','0.92','high'],
  ['src/checkout/orchestrator.js','Checkout','fan-out × 4','74%','0.71','med'],
  ['tests/inventory/reserve.spec.js','Fulfillment','missing timeout case','43%','0.66','med'],
  ['src/payment/authorize.js','Payments','downstream wait','89%','0.28','low']
];
document.querySelector('#riskRows').innerHTML = risks.map(r => `<tr><td><b>${r[0]}</b><small>${r[1]}</small></td><td>${r[2]}</td><td><span class="coverage-mini"><i style="width:${r[3]}"></i></span>${r[3]}</td><td><span class="risk ${r[5]}">${r[4]}</span></td></tr>`).join('');
document.querySelectorAll('.node').forEach(el => { el.addEventListener('click', () => { document.querySelectorAll('.node').forEach(n=>n.classList.remove('selected')); el.classList.add('selected'); }); });
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active'); document.querySelector('#viewTitle').textContent = ({path:'Which runtime path failed?',release:'What changed between releases?',evidence:'Can every claim be traced to evidence?'})[tab.dataset.view]; }));
document.querySelector('#toggleRelease').addEventListener('click', () => document.querySelector('[data-view="release"]').click());
