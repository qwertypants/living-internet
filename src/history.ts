import { type Event, toTrees } from './domain';
const sha = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const object = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('Expected object'); return v as Record<string, unknown>; };
const string = (v: unknown): string => { if (typeof v !== 'string' || !v.trim()) throw Error('Expected nonempty string'); return v; };
export function parseHistory(value: unknown): Event[] {
  const root = object(value);
  if (root.schemaVersion !== 1 || !Array.isArray(root.projects) || !Array.isArray(root.commits)) throw Error('Invalid history schema');
  const projects = new Map<string, string>();
  for (const entry of root.projects) { const p = object(entry), id = string(p.id); if (!/^[a-f0-9]{64}$/.test(id) || projects.has(id)) throw Error('Invalid or duplicate project'); projects.set(id, string(p.label)); }
  const ids = new Set<string>(), matching = new Set<string>();
  const events = root.commits.map(entry => {
    const c = object(entry), projectId = string(c.projectId), hash = string(c.sha), occurredAt = string(c.occurredAt);
    if (!projects.has(projectId) || !sha.test(hash) || !Array.isArray(c.parents) || c.parents.some(p => typeof p !== 'string' || !sha.test(p)) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(occurredAt) || !Number.isFinite(Date.parse(occurredAt)) || new Date(occurredAt).toISOString() !== occurredAt) throw Error('Invalid commit metadata');
    const id = `git:${projectId}:${hash}`; if (ids.has(id)) throw Error('Duplicate commit'); ids.add(id); matching.add(projectId);
    return { id, source: 'git', kind: 'git.commit', projectId, occurredAt, payload: { sha: hash, subject: 'Subject not imported', branch: '', projectLabel: projects.get(projectId), parents: c.parents } } as Event;
  });
  const coverage = object(root.coverage);
  for (const key of ['repositoryCount','matchingRepositoryCount','commitCount','unreadableRepositoryCount']) if (!Number.isSafeInteger(coverage[key]) || Number(coverage[key]) < 0) throw Error('Invalid coverage');
  if (coverage.commitCount !== events.length || coverage.matchingRepositoryCount !== matching.size || Number(coverage.repositoryCount) < projects.size || Number(coverage.repositoryCount) - projects.size > Number(coverage.unreadableRepositoryCount)) throw Error('Inconsistent coverage');
  return toTrees(events);
}
export function readStored(value: unknown): Event[] {
  if (!Array.isArray(value)) return parseHistory(value);
  for (const entry of value) { const e = object(entry), p = object(e.payload); if (typeof e.id !== 'string' || !['git','synthetic'].includes(String(e.source)) || e.kind !== 'git.commit' || typeof e.projectId !== 'string' || typeof e.occurredAt !== 'string' || !Number.isFinite(Date.parse(e.occurredAt)) || typeof p.sha !== 'string' || typeof p.subject !== 'string' || typeof p.branch !== 'string') throw Error('Invalid saved events'); }
  return toTrees(value as Event[]);
}
