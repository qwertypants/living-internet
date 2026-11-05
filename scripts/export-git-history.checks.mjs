import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { exportHistory } from './export-git-history.mjs';
test('packed all-ref history, exact authors, duplicate worktrees and deterministic export', async () => {
 const root = await mkdtemp(join(tmpdir(), 'history-test-'));
 const repo = join(root, 'repo'), worktree = join(root, 'worktree');
 const git = (...args) => execFileSync('git', args, {cwd: root, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
 try {
 git('init', repo); git('-C',repo,'config','user.email','mine@example.invalid'); git('-C',repo,'config','user.name','Fixture');
 let parent;
 for(let i=0;i<1005;i++) {
 const tree=git('-C',repo,'mktree');
 parent=git('-C',repo,'commit-tree',tree,...(parent?['-p',parent]:[]),'-m','private fixture');
 }
 git('-C',repo,'update-ref','refs/heads/main',parent);
 git('-C',repo,'config','user.email','other@example.invalid');
 const other=git('-C',repo,'commit-tree',git('-C',repo,'mktree'),'-p',parent,'-m','excluded');
 git('-C',repo,'update-ref','refs/heads/other',other);
 git('-C',repo,'config','user.email','MINE@example.invalid');
 git('-C',repo,'worktree','add','--detach',worktree,'main'); git('-C',repo,'gc');
 const before=git('-C',repo,'show-ref');
 const inventory=[{path:repo},{path:worktree}];
 const a=await exportHistory(inventory), b=await exportHistory(inventory);
 assert.deepEqual(a,b); assert.equal(a.coverage.repositoryCount,1); assert.equal(a.commits.length,1005);
 assert.ok(!a.commits.some(c=>c.sha===other)); assert.equal(git('-C',repo,'show-ref'),before);
 assert.ok(!JSON.stringify(a).includes('@'));
 } finally { await rm(root,{recursive:true,force:true}); }
});
