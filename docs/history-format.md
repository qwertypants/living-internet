# Private Git history export

Run `node scripts/export-git-history.mjs --inventory /path/to/private/inventory.json --output local/history.json` from the checkout. Inventory is an array of `{path, commonDir}`; commonDir is a hint only and is recomputed with Git. Sources are read only. No fetch is performed.

Schema version 1 has `projects: [{id,label}]`, `commits: [{projectId,sha,parents,occurredAt}]` and `coverage: {repositoryCount,matchingRepositoryCount,commitCount,unreadableRepositoryCount}`. IDs are SHA-256 hashes of resolved common directories; labels are basenames. Full commit/parent hashes and author timestamps in ISO UTC are retained. Emails are matched exactly, case insensitively against the union of configured identities, and never exported. Commit count counts project/commit pairs. Projects include readable repositories with zero matches.

All refs are scanned without a recent-history cutoff or mailmap rewriting. Shared common directories and project SHAs are deduplicated. Ordering is deterministic. Git records stream with backpressure; a five-minute per-command timeout, 1 MiB record buffer and two-million matching commits per repository fail that source visibly in the unreadable count rather than exporting a partial source. Final JSON is held in memory. Failed inventory entries count as unreadable; repositoryCount counts resolved unique common directories. Missing configured email contributes no identity. Inventory omissions and historical aliases cannot be inferred.

Output is atomically replaced with mode 0600. Keep it under ignored local/, outside public assets. Browser validation and integration are Task 7.
