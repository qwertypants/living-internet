import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
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
 const side=git('-C',repo,'commit-tree',git('-C',repo,'mktree'),'-p',parent,'-m','matching side branch');
 git('-C',repo,'update-ref','refs/heads/side',side);
 git('-C',repo,'worktree','add','--detach',worktree,'main'); git('-C',repo,'gc');
 const before=git('-C',repo,'show-ref');
 const inventory=[{path:repo},{path:worktree}];
 const a=await exportHistory(inventory), b=await exportHistory(inventory);
 assert.deepEqual(a,b); assert.equal(a.coverage.repositoryCount,1); assert.equal(a.commits.length,1006); assert.ok(a.commits.some(c=>c.sha===side));
 assert.ok(!a.commits.some(c=>c.sha===other)); assert.equal(git('-C',repo,'show-ref'),before);
 assert.ok(!JSON.stringify(a).includes('@'));
 } finally { await rm(root,{recursive:true,force:true}); }
});

test('large streamed history does not hit JavaScript argument limits', async () => {
 const root=await mkdtemp(join(tmpdir(),'history-large-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 try {
  git('init',root);git('config','user.email','mine@example.invalid');
  const count=140000;
  const records=Array.from({length:count},(_,i)=>`commit refs/heads/main\nauthor Fixture <mine@example.invalid> ${1600000000+i} +0000\ncommitter Fixture <mine@example.invalid> ${1600000000+i} +0000\ndata 1\nx\n\n`).join('');
  execFileSync('git',['-C',root,'fast-import','--quiet'],{input:records,stdio:['pipe','pipe','pipe']});
  const result=await exportHistory([{path:root}]);
  assert.equal(result.commits.length,count);assert.equal(result.coverage.unreadableRepositoryCount,0);
 } finally {await rm(root,{recursive:true,force:true});}
});

test('configuration command failure is reported instead of silently losing identity',async()=>{
 const root=await mkdtemp(join(tmpdir(),'history-config-'));const repo=join(root,'repo');
 const realGit=execFileSync('which',['git'],{encoding:'utf8'}).trim();
 const oldPath=process.env.PATH;
 try {
  execFileSync(realGit,['init',repo],{stdio:'pipe'});
  const wrapper=join(root,'git');
  await writeFile(wrapper,`#!${process.execPath}\nconst {spawnSync}=require('node:child_process');const args=process.argv.slice(2);if(args.includes('config'))process.exit(128);const r=spawnSync(${JSON.stringify(realGit)},args,{stdio:'inherit'});process.exit(r.status??1);\n`);
  await chmod(wrapper,0o700);process.env.PATH=root+delimiter+oldPath;
  const result=await exportHistory([{path:repo}]);
  assert.equal(result.coverage.unreadableRepositoryCount,1);assert.equal(result.commits.length,0);
 } finally {process.env.PATH=oldPath;await rm(root,{recursive:true,force:true});}
});
