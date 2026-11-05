import { expect, test } from 'vitest';
import { parseHistory, readStored } from './history';
import { makeDemoEvents } from './domain';
const project = 'a'.repeat(64);
const envelope = () => ({schemaVersion:1, projects:[{id:project,label:'repository'}], commits:[{projectId:project,sha:'b'.repeat(40),parents:[],occurredAt:'2025-01-01T00:00:00.000Z'}],coverage:{repositoryCount:1,matchingRepositoryCount:1,commitCount:1,unreadableRepositoryCount:0}});
test('stable provenance and canonical legacy ordering', () => { const e = envelope(); expect(parseHistory(e)).toEqual(parseHistory(e)); expect(parseHistory(e)[0].id).toBe(`git:${project}:${'b'.repeat(40)}`); expect(parseHistory(e)[0].payload.branch).toBe(''); const demo = makeDemoEvents(); expect(readStored([...demo].reverse())).toEqual(readStored(demo)); });
test('reject malformed metadata and coverage', () => { for (const mutate of [(e: ReturnType<typeof envelope>) => {e.commits[0].sha='b'.repeat(41)}, (e: ReturnType<typeof envelope>) => {e.commits[0].occurredAt='2025-02-30T00:00:00.000Z'}, (e: ReturnType<typeof envelope>) => {e.commits.push(e.commits[0])}, (e: ReturnType<typeof envelope>) => {e.coverage.commitCount=2}, (e: ReturnType<typeof envelope>) => {e.commits[0].projectId='c'.repeat(64)}]) { const e=envelope(); mutate(e); expect(()=>parseHistory(e)).toThrow(); } expect(()=>parseHistory(null)).toThrow(); });
