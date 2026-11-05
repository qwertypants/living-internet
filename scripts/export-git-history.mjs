import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, realpath, mkdir, open, rename, unlink } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

// A failed source contributes no partial commits. Resource limits fail visibly.
async function git(path, args, consume) {
  const child = spawn('git', ['--no-pager', '-C', path, ...args], {
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1' },
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const completion = new Promise((yes, no) => {
    child.on('error', no);
    child.on('close', code => code === 0 ? yes() : no(Object.assign(new Error('Git source failed'), { exitCode: code })));
  });
  completion.catch(() => {});
  const timer = setTimeout(() => child.kill(), 300000);
  let pending = '';
  try {
    for await (const chunk of child.stdout) {
      pending += chunk.toString('utf8');
      if (pending.length > 1048576) throw new Error('Git record limit exceeded');
      let end;
      while ((end = pending.indexOf('\n')) >= 0) {
        consume(pending.slice(0, end));
        pending = pending.slice(end + 1);
      }
    }
    if (pending) consume(pending);
    await completion;
  } catch (error) { child.kill(); throw error; }
  finally { clearTimeout(timer); }
}
async function scalar(path, args) {
  const lines = [];
  await git(path, args, line => { if (lines.length > 10000) throw new Error('Config limit'); lines.push(line); });
  return lines.join('\n').trim();
}
export async function exportHistory(inventory) {
  const repos = new Map();
  const identities = new Set();
  let unreadable = 0;
  for (const entry of inventory) {
    try {
      const common = await realpath(resolve(entry.path, await scalar(entry.path, ['rev-parse', '--git-common-dir'])));
      // Inventory hints are untrusted; Git is authoritative.
      const email = await scalar(entry.path, ['config', '--get', 'user.email']).catch(error => {
        if (error.exitCode === 1) return '';
        throw error;
      });
      if (email) identities.add(email.toLowerCase());
      const label = basename(entry.path);
      if (!repos.has(common) || label < repos.get(common).label) repos.set(common, { path: entry.path, label });
    } catch { unreadable++; }
  }
  const projects = [], commits = [];
  for (const [common, repo] of [...repos].sort(([a], [b]) => a.localeCompare(b))) {
    const id = createHash('sha256').update(common).digest('hex');
    const found = new Map();
    try {
      await git(repo.path, ['-c', 'log.showSignature=false', 'log', '--all', '--no-show-signature', '--no-use-mailmap', '--format=%H%x00%P%x00%at%x00%ae', '--no-patch'], line => {
        if (!line) return;
        const [sha, parents, time, email] = line.split('\0');
        if (!/^[a-f0-9]{40,64}$/.test(sha) || parents.split(' ').filter(Boolean).some(p => !/^[a-f0-9]{40,64}$/.test(p))) throw new Error('Invalid metadata');
        if (identities.has(email?.toLowerCase())) found.set(sha, { projectId: id, sha, parents: parents.split(' ').filter(Boolean), occurredAt: new Date(Number(time) * 1000).toISOString() });
        if (found.size > 2000000) throw new Error('Commit resource limit exceeded');
      });
      projects.push({ id, label: repo.label });
      for (const commit of found.values()) commits.push(commit);
    } catch { unreadable++; }
  }
  projects.sort((a,b) => a.id.localeCompare(b.id));
  commits.sort((a,b) => a.occurredAt.localeCompare(b.occurredAt) || a.projectId.localeCompare(b.projectId) || a.sha.localeCompare(b.sha));
  return { schemaVersion: 1, projects, commits, coverage: { repositoryCount: repos.size, matchingRepositoryCount: new Set(commits.map(c => c.projectId)).size, commitCount: commits.length, unreadableRepositoryCount: unreadable } };
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--inventory' || args[2] !== '--output') throw new Error('Use --inventory PATH --output PATH');
  const result = await exportHistory(JSON.parse(await readFile(args[1], 'utf8')));
  const output = resolve(args[3]);
  await mkdir(dirname(output), { recursive: true, mode: 0o700 });
  const temporary = `${output}.${process.pid}.tmp`;
  try {
    const file = await open(temporary, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(result) + '\n'); } finally { await file.close(); }
    await rename(temporary, output);
  } finally { await unlink(temporary).catch(() => {}); }
  console.log(JSON.stringify(result.coverage));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { console.error('Export failed'); process.exitCode = 1; });
