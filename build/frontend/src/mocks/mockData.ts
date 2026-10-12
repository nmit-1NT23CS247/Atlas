import {
  Product,
  Branch,
  Commit,
  Build,
  StableRecord,
  ReleaseRecord,
  AuditEntry,
  EligibilityCheck,
} from '../types/index.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'esm',
    name: 'Enterprise Service Management',
    code: 'ESM',
    description: 'Cloud-native enterprise ticketing, ITSM service orchestration and asset discovery suite',
    gitlabUrl: 'https://gitlab.internal.corp/enterprise/esm',
  },
  {
    id: 'smax',
    name: 'Service Management Automation X',
    code: 'SMAX',
    description: 'Next-generation AI-assisted IT service automation platform and smart analytics engine',
    gitlabUrl: 'https://gitlab.internal.corp/enterprise/smax',
  },
];

export const INITIAL_BRANCHES: Branch[] = [
  // ESM branches
  {
    id: 'esm-main',
    name: 'main',
    productId: 'esm',
    isDefault: true,
    lastCommitSha: 'a71b4e2098dcf621',
    lastCommitTime: '2026-10-11T22:45:00Z',
  },
  {
    id: 'esm-release-26-4',
    name: 'release/26.4',
    productId: 'esm',
    isDefault: false,
    lastCommitSha: 'e92a8310bc93170a',
    lastCommitTime: '2026-10-11T21:10:00Z',
  },
  {
    id: 'esm-patch-26-4-x',
    name: 'patch/26.4.x',
    productId: 'esm',
    isDefault: false,
    lastCommitSha: 'c441b8a92f008234',
    lastCommitTime: '2026-10-11T18:30:00Z',
  },

  // SMAX branches
  {
    id: 'smax-main',
    name: 'main',
    productId: 'smax',
    isDefault: true,
    lastCommitSha: 'f3918a09bc003211',
    lastCommitTime: '2026-10-11T22:15:00Z',
  },
  {
    id: 'smax-release-26-4',
    name: 'release/26.4',
    productId: 'smax',
    isDefault: false,
    lastCommitSha: 'd2209bb45100aa77',
    lastCommitTime: '2026-10-11T20:50:00Z',
  },
  {
    id: 'smax-patch-26-4-x',
    name: 'patch/26.4.x',
    productId: 'smax',
    isDefault: false,
    lastCommitSha: 'b1192801ca887102',
    lastCommitTime: '2026-10-11T16:20:00Z',
  },
];

// Helper to generate realistic commits
function generateCommits(): Commit[] {
  const authors = [
    { name: 'Sarah Chen', email: 'schen@corp.gitlab' },
    { name: 'Alexandre Dumas', email: 'adumas@corp.gitlab' },
    { name: 'Priya Nair', email: 'pnair@corp.gitlab' },
    { name: 'Marcus Vance', email: 'mvance@corp.gitlab' },
    { name: 'Elena Rostova', email: 'erostova@corp.gitlab' },
  ];

  const messagesByBranch: Record<string, string[]> = {
    main: [
      'feat(auth): integrate OIDC federated single sign-on provider',
      'fix(db): resolve deadlock on concurrent workflow transitions',
      'perf(cache): optimize redis cluster pipeline invalidation keys',
      'refactor(api): standardize error payload format across REST endpoints',
      'feat(search): implement Elasticsearch 8.12 hybrid vector search',
      'fix(audit): ensure tenant ID isolation in compliance event streams',
      'chore(deps): bump internal grpc-transport to v3.14.0',
      'fix(ui): correct table pagination boundary check on empty states',
      'perf(query): add compound index on tenant_tickets_status_idx',
      'feat(notifications): support batched webhook delivery retry backoff',
      'ci: upgrade container builder to debian bookworm baseline',
      'fix(gateway): mitigate memory leak in high-throughput websocket proxy',
      'feat(export): add async background CSV export with signed S3 url',
      'fix(scheduler): handle daylight saving jump in cron trigger evaluator',
      'docs: update swagger specifications for system health probes',
      'test: increase integration test coverage for ticket SLA timers',
      'refactor(core): decouple legacy message bus dispatcher',
      'fix(sec): sanitize markdown user input in description fields',
      'feat(telemetry): emit OpenTelemetry spans for db transaction spans',
      'chore(build): parallelize typescript declaration emit stages',
      'fix(config): reload consul configurations gracefully without restart',
      'feat(graphql): add field resolvers for incident team assignments',
      'perf(json): migrate high-volume payloads to simdjson parser',
      'fix(agent): handle disconnect handshake properly on agent daemon',
      'chore(cleanup): remove deprecated v1 legacy report endpoints',
    ],
    'release/26.4': [
      'fix(release): backport hotfix for session token timeout invalidation',
      'feat(compat): stabilize database migration scripts for v26.4',
      'fix(ldap): handle nested group sync when directory tree depth > 5',
      'perf(indexer): throttle background reindexing during peak traffic',
      'fix(reports): format currency columns according to locale settings',
      'chore(release): lock release manifests for candidate validation',
      'fix(billing): correct prorated license seat calculations',
      'test(e2e): verify end-to-end checkout & provisioning flow',
      'fix(sso): handle SAML assertion replay attack edge cases',
      'docs(release): compile release notes and breaking changes guide',
      'fix(worker): prevent race condition in celery queue consumer',
      'feat(monitoring): export prometheus scrape endpoints on port 9090',
      'fix(mail): set proper UTF-8 charset on automated alert dispatches',
      'refactor(security): enforce TLS 1.3 requirement on external webhooks',
      'chore(version): bump version descriptor to 26.4.1-rc3',
      'fix(cache): fix key collision in distributed multi-tenant cache',
      'fix(api): fix null pointer exception when query param is undefined',
      'test: add stress tests for 5000 concurrent websocket connections',
      'fix(cli): handle SIGINT gracefully in administrative CLI utility',
      'fix(ui): prevent double submission on checkout action modal',
      'perf(db): optimize batch insert performance with unnest function',
      'fix(audit): log administrative password reset trigger events',
      'chore(infra): update staging deployment helm charts',
      'fix(storage): retry transient S3 503 SlowDown responses',
      'docs: update deployment troubleshooting guide for 26.4',
    ],
    'patch/26.4.x': [
      'fix(patch): security patch CVE-2026-38290 parameter parser sanitization',
      'fix(patch): hotfix deadlock in high-volume workflow execution',
      'fix(patch): patch memory leak in redis streaming client pool',
      'fix(patch): fix broken link in email notification templates',
      'fix(patch): repair broken foreign key cascade in archived tickets',
      'fix(patch): resolve race condition in token refresh loop',
      'fix(patch): prevent unhandled exception in PDF export engine',
      'fix(patch): restore compatibility with OpenSSL 3.2.0',
      'chore(patch): bump patch revision to 26.4.2-p1',
      'fix(patch): handle null author in gitlab webhook callback receiver',
      'fix(patch): sanitize CSV export fields against formula injection',
      'fix(patch): fix timezone skew on calendar event sync',
      'fix(patch): correct status mapping for failed background jobs',
      'test(patch): add regression test suite for CVE-2026-38290',
      'fix(patch): prevent deadlocks on high concurrency ticket inserts',
      'fix(patch): address edge case in license key validation algorithm',
      'fix(patch): fix styling regression on mobile table viewports',
      'fix(patch): handle DNS lookup timeouts gracefully in external client',
      'fix(patch): repair corrupted state transition in asset inventory',
      'fix(patch): properly release file descriptors on attachment downloads',
      'fix(patch): prevent duplicate webhook triggers on slow responses',
      'fix(patch): address cross-site request forgery token renewal glitch',
      'fix(patch): fix integer overflow in long-running job counter',
      'chore(patch): finalize release candidates for emergency patch release',
      'docs(patch): draft security advisory disclosure documentation',
    ],
  };

  const results: Commit[] = [];
  const baseTime = new Date('2026-10-11T23:00:00Z').getTime();

  INITIAL_PRODUCTS.forEach((prod) => {
    INITIAL_BRANCHES.filter((b) => b.productId === prod.id).forEach((branch) => {
      const branchKey = branch.name.startsWith('patch')
        ? 'patch/26.4.x'
        : branch.name.startsWith('release')
        ? 'release/26.4'
        : 'main';

      const msgs = messagesByBranch[branchKey] || messagesByBranch.main;

      msgs.forEach((msg, idx) => {
        const timeOffset = (idx * 3.5 + Math.random() * 2) * 3600 * 1000;
        const commitTime = new Date(baseTime - timeOffset).toISOString();
        const hex = (Math.sin(idx * 7919 + prod.id.length * 31) * 1000000000)
          .toString(16)
          .replace(/[^a-f0-9]/g, '')
          .padEnd(16, 'a')
          .slice(0, 16);

        const author = authors[idx % authors.length];
        const sha = hex;
        const shortSha = sha.slice(0, 8);

        // Mix of realistic statuses:
        // Recent 2 might be Pending or Running
        // Some without builds, some with builds
        let buildId: string | undefined;
        let pipelineId: string | undefined;
        let pipelineStatus: Commit['pipelineStatus'];
        let version: string | undefined;
        let tags: Commit['tags'] = undefined;
        let signingStatus: Commit['signingStatus'] = undefined;
        let repackagingStatus: Commit['repackagingStatus'] = undefined;

        if (idx === 0 && branch.name === 'main') {
          // Commit without build (to test "Build" button)
          buildId = undefined;
          pipelineId = undefined;
          pipelineStatus = undefined;
        } else if (idx === 1 && branch.name === 'main') {
          // In-flight running pipeline
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Running';
          version = `${prod.code.toLowerCase()}-26.5.0-alpha.${120 - idx}`;
        } else if (idx === 2) {
          // Pending pipeline
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Pending';
          version = `${prod.code.toLowerCase()}-26.5.0-alpha.${120 - idx}`;
        } else if (idx === 3) {
          // Successful build, ready to Promote Stable (not yet stable)
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Success';
          version = `${prod.code.toLowerCase()}-26.4.2-bld.${80 - idx}`;
        } else if (idx === 4) {
          // Failed pipeline
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Failed';
          version = `${prod.code.toLowerCase()}-26.4.2-bld.${80 - idx}`;
        } else if (idx === 5) {
          // Canceled pipeline
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Canceled';
          version = `${prod.code.toLowerCase()}-26.4.1-bld.${80 - idx}`;
        } else if (idx === 6) {
          // Current Stable commit
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Success';
          version = `${prod.code.toLowerCase()}-26.4.1`;
          tags = ['Stable'];
          signingStatus = 'Not Started';
          repackagingStatus = 'Not Started';
        } else if (idx === 7) {
          // Previous Stable & Released
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Success';
          version = `${prod.code.toLowerCase()}-26.4.0`;
          tags = ['Stable', 'Released'];
          signingStatus = 'Success';
          repackagingStatus = 'Success';
        } else if (idx === 8 && branch.name.startsWith('patch')) {
          // Candidate with signing succeeded and repackaging failed
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Success';
          version = `${prod.code.toLowerCase()}-26.4.0-p1`;
          tags = ['Stable'];
          signingStatus = 'Success';
          repackagingStatus = 'Failed';
        } else if (idx % 5 === 0) {
          // No build triggered yet
          buildId = undefined;
          pipelineId = undefined;
          pipelineStatus = undefined;
        } else if (idx % 4 === 0) {
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Failed';
          version = `${prod.code.toLowerCase()}-26.4.0-bld.${100 - idx}`;
        } else {
          buildId = `bld-${prod.code.toLowerCase()}-${shortSha}`;
          pipelineId = `pl-${98400 + idx}`;
          pipelineStatus = 'Success';
          version = `${prod.code.toLowerCase()}-26.4.0-bld.${100 - idx}`;
        }

        results.push({
          id: `cmt-${prod.id}-${branch.name}-${shortSha}`,
          sha,
          shortSha,
          productId: prod.id,
          branch: branch.name,
          message: msg,
          authorName: author.name,
          authorEmail: author.email,
          timestamp: commitTime,
          buildId,
          version,
          pipelineId,
          pipelineStatus,
          tags,
          signingStatus,
          repackagingStatus,
          gitlabUrl: `${prod.gitlabUrl}/-/commit/${sha}`,
        });
      });
    });
  });

  return results;
}

export const INITIAL_COMMITS: Commit[] = generateCommits();

export const INITIAL_STABLE_RECORDS: StableRecord[] = [
  // ESM main
  {
    id: 'st-esm-main-1',
    productId: 'esm',
    branch: 'main',
    version: 'esm-26.4.1-stable',
    commitSha: '6b91c890123ef81a',
    shortSha: '6b91c890',
    promotedBy: 'Elena Rostova',
    promotedAt: '2026-10-10T14:32:00Z',
    result: 'Success',
    isCurrent: true,
  },
  {
    id: 'st-esm-main-2',
    productId: 'esm',
    branch: 'main',
    version: 'esm-26.4.0-stable',
    commitSha: '4a108c9098ef1102',
    shortSha: '4a108c90',
    promotedBy: 'Sarah Chen',
    promotedAt: '2026-10-04T09:15:00Z',
    result: 'Success',
    isPrevious: true,
  },
  // ESM release/26.4
  {
    id: 'st-esm-rel-1',
    productId: 'esm',
    branch: 'release/26.4',
    version: 'esm-26.4.1-rc2',
    commitSha: 'e92a8310bc93170a',
    shortSha: 'e92a8310',
    promotedBy: 'Alexandre Dumas',
    promotedAt: '2026-10-09T18:20:00Z',
    result: 'Success',
    isCurrent: true,
  },
  {
    id: 'st-esm-rel-2',
    productId: 'esm',
    branch: 'release/26.4',
    version: 'esm-26.4.0-final',
    commitSha: '8092ca89bb002231',
    shortSha: '8092ca89',
    promotedBy: 'Sarah Chen',
    promotedAt: '2026-10-01T11:45:00Z',
    result: 'Success',
    isPrevious: true,
  },
  // ESM patch/26.4.x
  {
    id: 'st-esm-patch-1',
    productId: 'esm',
    branch: 'patch/26.4.x',
    version: 'esm-26.4.0-p2',
    commitSha: 'c441b8a92f008234',
    shortSha: 'c441b8a9',
    promotedBy: 'Marcus Vance',
    promotedAt: '2026-10-08T16:05:00Z',
    result: 'Success',
    isCurrent: true,
  },
  {
    id: 'st-esm-patch-2',
    productId: 'esm',
    branch: 'patch/26.4.x',
    version: 'esm-26.4.0-p1',
    commitSha: '71008811ca992201',
    shortSha: '71008811',
    promotedBy: 'Priya Nair',
    promotedAt: '2026-09-28T10:10:00Z',
    result: 'Success',
    isPrevious: true,
  },

  // SMAX main
  {
    id: 'st-smax-main-1',
    productId: 'smax',
    branch: 'main',
    version: 'smax-26.4.1-stable',
    commitSha: '8a221190bc771029',
    shortSha: '8a221190',
    promotedBy: 'Sarah Chen',
    promotedAt: '2026-10-10T16:40:00Z',
    result: 'Success',
    isCurrent: true,
  },
  {
    id: 'st-smax-main-2',
    productId: 'smax',
    branch: 'main',
    version: 'smax-26.4.0-stable',
    commitSha: '290199aa11883344',
    shortSha: '290199aa',
    promotedBy: 'Alexandre Dumas',
    promotedAt: '2026-10-03T08:30:00Z',
    result: 'Success',
    isPrevious: true,
  },
  // SMAX release/26.4
  {
    id: 'st-smax-rel-1',
    productId: 'smax',
    branch: 'release/26.4',
    version: 'smax-26.4.1-rc1',
    commitSha: 'd2209bb45100aa77',
    shortSha: 'd2209bb4',
    promotedBy: 'Elena Rostova',
    promotedAt: '2026-10-09T20:15:00Z',
    result: 'Success',
    isCurrent: true,
  },
  {
    id: 'st-smax-rel-2',
    productId: 'smax',
    branch: 'release/26.4',
    version: 'smax-26.4.0-final',
    commitSha: '5566778899aabbcc',
    shortSha: '55667788',
    promotedBy: 'Priya Nair',
    promotedAt: '2026-10-02T15:20:00Z',
    result: 'Success',
    isPrevious: true,
  },
  // SMAX patch/26.4.x
  {
    id: 'st-smax-patch-1',
    productId: 'smax',
    branch: 'patch/26.4.x',
    version: 'smax-26.4.0-p1',
    commitSha: 'b1192801ca887102',
    shortSha: 'b1192801',
    promotedBy: 'Marcus Vance',
    promotedAt: '2026-10-07T12:00:00Z',
    result: 'Success',
    isCurrent: true,
  },
  {
    id: 'st-smax-patch-2',
    productId: 'smax',
    branch: 'patch/26.4.x',
    version: 'smax-26.4.0-hotfix',
    commitSha: '9900112233445566',
    shortSha: '99001122',
    promotedBy: 'Elena Rostova',
    promotedAt: '2026-09-29T17:50:00Z',
    result: 'Success',
    isPrevious: true,
  },
];

export const INITIAL_RELEASES: ReleaseRecord[] = [
  {
    id: 'rel-esm-26-4-0',
    productId: 'esm',
    branch: 'release/26.4',
    version: 'esm-v26.4.0-GA',
    sourceStableBuildId: 'st-esm-rel-2',
    releaseStatus: 'Success',
    signingStatus: 'Success',
    repackagingStatus: 'Success',
    startedBy: 'Sarah Chen',
    startedAt: '2026-10-02T08:00:00Z',
    completedAt: '2026-10-02T10:35:00Z',
  },
  {
    id: 'rel-smax-26-4-1',
    productId: 'smax',
    branch: 'release/26.4',
    version: 'smax-v26.4.1-rc1',
    sourceStableBuildId: 'st-smax-rel-1',
    releaseStatus: 'Success',
    signingStatus: 'Running',
    repackagingStatus: 'Not Started',
    startedBy: 'Alexandre Dumas',
    startedAt: '2026-10-11T20:15:00Z',
  },
  {
    id: 'rel-esm-26-4-1-p1',
    productId: 'esm',
    branch: 'patch/26.4.x',
    version: 'esm-v26.4.1-patch1',
    sourceStableBuildId: 'st-esm-patch-1',
    releaseStatus: 'Success',
    signingStatus: 'Success',
    repackagingStatus: 'Failed',
    startedBy: 'Elena Rostova',
    startedAt: '2026-10-11T16:00:00Z',
    errorMessage: 'Package manifest checksum mismatch during RPM wrap-up: sha256 error on pkg/esm-core-lib.rpm',
    retryAllowed: true,
  },
];

export const INITIAL_ACTIVITY: AuditEntry[] = [
  {
    id: 'act-1',
    timestamp: '2026-10-11T22:30:12Z',
    user: 'Sarah Chen',
    action: 'Build',
    product: 'ESM',
    branch: 'main',
    commit: 'a71b4e20',
    version: 'esm-26.5.0-alpha.119',
    outcome: 'In Progress',
  },
  {
    id: 'act-2',
    timestamp: '2026-10-11T21:45:00Z',
    user: 'Elena Rostova',
    action: 'Promote Stable',
    product: 'ESM',
    branch: 'main',
    commit: '6b91c890',
    version: 'esm-26.4.1-stable',
    outcome: 'Success',
  },
  {
    id: 'act-3',
    timestamp: '2026-10-11T20:15:22Z',
    user: 'Alexandre Dumas',
    action: 'Release',
    product: 'SMAX',
    branch: 'release/26.4',
    commit: 'd2209bb4',
    version: 'smax-v26.4.1-rc1',
    outcome: 'In Progress',
  },
  {
    id: 'act-4',
    timestamp: '2026-10-11T19:50:11Z',
    user: 'Marcus Vance',
    action: 'Build',
    product: 'SMAX',
    branch: 'main',
    commit: 'f3918a09',
    version: 'smax-26.5.0-bld.98',
    outcome: 'Success',
  },
  {
    id: 'act-5',
    timestamp: '2026-10-11T18:12:44Z',
    user: 'Priya Nair',
    action: 'Build',
    product: 'ESM',
    branch: 'patch/26.4.x',
    commit: 'c441b8a9',
    version: 'esm-26.4.0-p2',
    outcome: 'Success',
  },
  {
    id: 'act-6',
    timestamp: '2026-10-11T16:00:00Z',
    user: 'Elena Rostova',
    action: 'Release',
    product: 'ESM',
    branch: 'patch/26.4.x',
    commit: 'c441b8a9',
    version: 'esm-v26.4.1-patch1',
    outcome: 'Failed',
  },
  {
    id: 'act-7',
    timestamp: '2026-10-11T15:20:30Z',
    user: 'Sarah Chen',
    action: 'Build',
    product: 'ESM',
    branch: 'main',
    commit: 'b9982310',
    version: 'esm-26.5.0-alpha.118',
    outcome: 'Failed',
  },
  {
    id: 'act-8',
    timestamp: '2026-10-11T14:10:00Z',
    user: 'Alexandre Dumas',
    action: 'Promote Stable',
    product: 'SMAX',
    branch: 'main',
    commit: '8a221190',
    version: 'smax-26.4.1-stable',
    outcome: 'Success',
  },
  {
    id: 'act-9',
    timestamp: '2026-10-11T12:40:15Z',
    user: 'Marcus Vance',
    action: 'Build',
    product: 'SMAX',
    branch: 'release/26.4',
    commit: 'd2209bb4',
    version: 'smax-26.4.1-rc1',
    outcome: 'Success',
  },
  {
    id: 'act-10',
    timestamp: '2026-10-11T11:05:40Z',
    user: 'Priya Nair',
    action: 'Build',
    product: 'ESM',
    branch: 'release/26.4',
    commit: 'e92a8310',
    version: 'esm-26.4.1-rc2',
    outcome: 'Success',
  },
  {
    id: 'act-11',
    timestamp: '2026-10-11T09:30:00Z',
    user: 'Sarah Chen',
    action: 'Promote Stable',
    product: 'ESM',
    branch: 'release/26.4',
    commit: 'e92a8310',
    version: 'esm-26.4.1-rc2',
    outcome: 'Success',
  },
  {
    id: 'act-12',
    timestamp: '2026-10-10T21:15:00Z',
    user: 'Elena Rostova',
    action: 'Build',
    product: 'SMAX',
    branch: 'patch/26.4.x',
    commit: 'b1192801',
    version: 'smax-26.4.0-p1',
    outcome: 'Success',
  },
  {
    id: 'act-13',
    timestamp: '2026-10-10T19:40:22Z',
    user: 'Alexandre Dumas',
    action: 'Build',
    product: 'ESM',
    branch: 'main',
    commit: '542018ea',
    version: 'esm-26.5.0-alpha.117',
    outcome: 'Success',
  },
  {
    id: 'act-14',
    timestamp: '2026-10-10T17:10:05Z',
    user: 'Marcus Vance',
    action: 'Build',
    product: 'SMAX',
    branch: 'main',
    commit: 'ee981240',
    version: 'smax-26.5.0-bld.97',
    outcome: 'Failed',
  },
  {
    id: 'act-15',
    timestamp: '2026-10-10T15:20:00Z',
    user: 'Priya Nair',
    action: 'Promote Stable',
    product: 'SMAX',
    branch: 'release/26.4',
    commit: 'd2209bb4',
    version: 'smax-26.4.1-rc1',
    outcome: 'Success',
  },
  {
    id: 'act-16',
    timestamp: '2026-10-10T13:45:19Z',
    user: 'Sarah Chen',
    action: 'Build',
    product: 'ESM',
    branch: 'main',
    commit: '6b91c890',
    version: 'esm-26.4.1-stable',
    outcome: 'Success',
  },
  {
    id: 'act-17',
    timestamp: '2026-10-10T11:15:30Z',
    user: 'Elena Rostova',
    action: 'Build',
    product: 'SMAX',
    branch: 'release/26.4',
    commit: '7722100a',
    version: 'smax-26.4.1-rc0',
    outcome: 'Success',
  },
  {
    id: 'act-18',
    timestamp: '2026-10-10T09:00:00Z',
    user: 'Alexandre Dumas',
    action: 'Build',
    product: 'ESM',
    branch: 'patch/26.4.x',
    commit: 'c441b8a9',
    version: 'esm-26.4.0-p2',
    outcome: 'Success',
  },
  {
    id: 'act-19',
    timestamp: '2026-10-09T22:30:00Z',
    user: 'Marcus Vance',
    action: 'Promote Stable',
    product: 'ESM',
    branch: 'patch/26.4.x',
    commit: 'c441b8a9',
    version: 'esm-26.4.0-p2',
    outcome: 'Success',
  },
  {
    id: 'act-20',
    timestamp: '2026-10-09T19:10:45Z',
    user: 'Priya Nair',
    action: 'Build',
    product: 'SMAX',
    branch: 'main',
    commit: '8a221190',
    version: 'smax-26.4.1-stable',
    outcome: 'Success',
  },
  {
    id: 'act-21',
    timestamp: '2026-10-09T16:40:11Z',
    user: 'Sarah Chen',
    action: 'Build',
    product: 'ESM',
    branch: 'release/26.4',
    commit: '33219001',
    version: 'esm-26.4.1-rc1',
    outcome: 'Failed',
  },
  {
    id: 'act-22',
    timestamp: '2026-10-09T14:15:00Z',
    user: 'Elena Rostova',
    action: 'Build',
    product: 'ESM',
    branch: 'main',
    commit: '89001122',
    version: 'esm-26.5.0-alpha.116',
    outcome: 'Success',
  },
  {
    id: 'act-23',
    timestamp: '2026-10-09T11:00:00Z',
    user: 'Alexandre Dumas',
    action: 'Build',
    product: 'SMAX',
    branch: 'patch/26.4.x',
    commit: '99001122',
    version: 'smax-26.4.0-hotfix',
    outcome: 'Success',
  },
  {
    id: 'act-24',
    timestamp: '2026-10-08T20:30:15Z',
    user: 'Marcus Vance',
    action: 'Build',
    product: 'ESM',
    branch: 'patch/26.4.x',
    commit: '71008811',
    version: 'esm-26.4.0-p1',
    outcome: 'Success',
  },
  {
    id: 'act-25',
    timestamp: '2026-10-08T17:15:00Z',
    user: 'Priya Nair',
    action: 'Promote Stable',
    product: 'SMAX',
    branch: 'patch/26.4.x',
    commit: 'b1192801',
    version: 'smax-26.4.0-p1',
    outcome: 'Success',
  },
  {
    id: 'act-26',
    timestamp: '2026-10-08T14:00:20Z',
    user: 'Sarah Chen',
    action: 'Build',
    product: 'SMAX',
    branch: 'main',
    commit: 'aa112233',
    version: 'smax-26.5.0-bld.96',
    outcome: 'Success',
  },
  {
    id: 'act-27',
    timestamp: '2026-10-08T10:45:00Z',
    user: 'Elena Rostova',
    action: 'Build',
    product: 'ESM',
    branch: 'main',
    commit: 'cc445566',
    version: 'esm-26.5.0-alpha.115',
    outcome: 'Success',
  },
  {
    id: 'act-28',
    timestamp: '2026-10-07T18:20:10Z',
    user: 'Alexandre Dumas',
    action: 'Release',
    product: 'ESM',
    branch: 'release/26.4',
    commit: '8092ca89',
    version: 'esm-v26.4.0-GA',
    outcome: 'Success',
  },
  {
    id: 'act-29',
    timestamp: '2026-10-07T15:10:00Z',
    user: 'Marcus Vance',
    action: 'Build',
    product: 'SMAX',
    branch: 'release/26.4',
    commit: '55667788',
    version: 'smax-26.4.0-final',
    outcome: 'Success',
  },
  {
    id: 'act-30',
    timestamp: '2026-10-07T11:30:00Z',
    user: 'Sarah Chen',
    action: 'Promote Stable',
    product: 'SMAX',
    branch: 'release/26.4',
    commit: '55667788',
    version: 'smax-26.4.0-final',
    outcome: 'Success',
  },
];
