const SERVICE_META = {
  edge: { label: 'EDGE GATEWAY', tone: 'aqua', owner: 'platform' },
  api: { label: 'CHECKOUT API', tone: 'violet', owner: 'checkout' },
  db: { label: 'LEDGER STORE', tone: 'gold', owner: 'data' },
  worker: { label: 'WORKER', tone: 'pink', owner: 'jobs' },
};

export function buildCity(analysis) {
  const critical = new Set(analysis.criticalPath.spanIds);
  const nodes = analysis.spans.map((span, index) => {
    const source = analysis.positions?.[span.id] || { x: 120 + (index % 4) * 180, y: 110 + Math.floor(index / 4) * 150, depth: 0 };
    return { id: span.id, label: span.name, service: span.service || 'unknown', x: 110 + source.depth * 230, y: 120 + (index % 5) * 92, duration: Number(span.duration) || 0, status: span.status || 'ok', owner: span.service || 'unowned', critical: critical.has(span.id), error: span.error || '' };
  });
  const edges = analysis.spans.filter((span) => span.parent).map((span) => { const from = nodes.find((node) => node.id === span.parent); const to = nodes.find((node) => node.id === span.id); const criticalEdge = Boolean(from?.critical && to?.critical); return { id: `${span.parent}->${span.id}`, from: span.parent, to: span.id, critical: criticalEdge, label: criticalEdge ? 'critical path' : 'calls' }; });
  const buildings = [...new Set(nodes.map((node) => node.service))].map((service, index) => ({ service, ...(SERVICE_META[service] || { label: service.toUpperCase(), tone: 'slate', owner: service }), x: 42 + (index % 3) * 305, y: 45 + Math.floor(index / 3) * 260, width: 275, height: 220 }));
  return { nodes, edges, buildings, criticalIds: [...critical] };
}

export function explainNode(node, analysis) {
  const span = analysis.spans.find((item) => item.id === node.id); const parent = span?.parent ? analysis.spans.find((item) => item.id === span.parent) : null; const child = analysis.spans.find((item) => item.parent === span?.id);
  return { title: node.label, subtitle: `${node.service} service · ${node.duration} ms`, status: node.status === 'error' ? 'Failed here' : node.status === 'skipped' ? 'Skipped after failure' : 'Completed', why: node.critical ? 'This span is on the longest exclusive-time path. Its duration is counted after nested child time is subtracted.' : 'This span is part of the request tree but is not on the longest exclusive-time path.', owner: node.owner, evidence: node.error || (node.status === 'skipped' ? 'Downstream work was not attempted.' : 'No failure evidence attached.'), connection: parent ? `Called by ${parent.name}${child ? ` · then ${child.name}` : ''}` : 'Request entry point' };
}

export function nextTourStep(step, analysis) {
  const failed = analysis.failed?.[0]; const path = analysis.criticalPath?.spanIds || [];
  const steps = [{ id: path[0], title: 'Start at the request gate', body: 'The city starts where the customer request enters. Follow the bright street to see where exclusive time accumulates.' }, { id: failed?.id || path[1], title: 'Find the failure', body: `${failed?.name || 'The highlighted span'} is the failure signal. Click it to inspect the owner, error, and implicated evidence.` }, { id: path[path.length - 1], title: 'See the blast radius', body: 'The dim downstream building shows what was skipped or endangered after the failure.' }];
  return steps[Math.min(Math.max(step, 0), steps.length - 1)];
}
