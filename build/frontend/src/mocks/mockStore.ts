import {
  Product,
  Branch,
  Commit,
  StableRecord,
  ReleaseRecord,
  AuditEntry,
  EligibilityCheck,
  PipelineStatus,
} from '../types/index.ts';
import {
  INITIAL_PRODUCTS,
  INITIAL_BRANCHES,
  INITIAL_COMMITS,
  INITIAL_STABLE_RECORDS,
  INITIAL_RELEASES,
  INITIAL_ACTIVITY,
} from './mockData.ts';

class MockDataStore {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private branches: Branch[] = [...INITIAL_BRANCHES];
  private commits: Commit[] = [...INITIAL_COMMITS];
  private stableRecords: StableRecord[] = [...INITIAL_STABLE_RECORDS];
  private releases: ReleaseRecord[] = [...INITIAL_RELEASES];
  private activities: AuditEntry[] = [...INITIAL_ACTIVITY];

  constructor() {
    // Start background simulation ticker for running pipelines
    this.startPipelineProgressSimulation();
  }

  getProducts(): Product[] {
    return [...this.products];
  }

  getBranches(productId: string): Branch[] {
    return this.branches.filter((b) => b.productId === productId);
  }

  getCommits(
    productId: string,
    branch: string,
    query?: string,
    status?: string,
    tag?: string,
    dateRange?: string
  ): Commit[] {
    let result = this.commits.filter(
      (c) => c.productId === productId && c.branch === branch
    );

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          c.shortSha.toLowerCase().includes(q) ||
          c.sha.toLowerCase().includes(q) ||
          c.authorName.toLowerCase().includes(q) ||
          (c.version && c.version.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All') {
      result = result.filter((c) => c.pipelineStatus === status);
    }

    if (tag && tag !== 'All') {
      result = result.filter((c) => c.tags && c.tags.includes(tag as any));
    }

    if (dateRange && dateRange !== 'all') {
      const now = Date.now();
      const dayMs = 24 * 3600 * 1000;
      result = result.filter((c) => {
        const commitTime = new Date(c.timestamp).getTime();
        if (dateRange === 'today') return now - commitTime <= dayMs;
        if (dateRange === '7d') return now - commitTime <= 7 * dayMs;
        if (dateRange === '30d') return now - commitTime <= 30 * dayMs;
        return true;
      });
    }

    return [...result];
  }

  triggerBuild(
    commitSha: string,
    productId: string,
    branch: string,
    userName: string = 'Current User'
  ): { success: boolean; commit: Commit } {
    const commitIdx = this.commits.findIndex(
      (c) => c.sha === commitSha && c.productId === productId && c.branch === branch
    );

    if (commitIdx === -1) {
      throw new Error(`Commit ${commitSha.slice(0, 8)} not found on ${branch}`);
    }

    const shortSha = commitSha.slice(0, 8);
    const prod = this.products.find((p) => p.id === productId);
    const prodCode = prod ? prod.code.toLowerCase() : 'app';
    const buildId = `bld-${prodCode}-${shortSha}`;
    const pipelineId = `pl-${Math.floor(100000 + Math.random() * 900000)}`;
    const version = `${prodCode}-26.5.0-alpha.${Math.floor(120 + Math.random() * 20)}`;

    const updatedCommit: Commit = {
      ...this.commits[commitIdx],
      buildId,
      pipelineId,
      pipelineStatus: 'Pending',
      version,
    };

    this.commits[commitIdx] = updatedCommit;

    // Log to activity
    this.activities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userName,
      action: 'Build',
      product: prod ? prod.code : productId.toUpperCase(),
      branch,
      commit: shortSha,
      version,
      outcome: 'In Progress',
    });

    // Simulate transition: Pending -> Running in 3s, Running -> Success/Failed in 8s
    setTimeout(() => {
      const idx = this.commits.findIndex((c) => c.sha === commitSha);
      if (idx !== -1 && this.commits[idx].pipelineStatus === 'Pending') {
        this.commits[idx] = { ...this.commits[idx], pipelineStatus: 'Running' };
      }
    }, 3000);

    setTimeout(() => {
      const idx = this.commits.findIndex((c) => c.sha === commitSha);
      if (idx !== -1 && this.commits[idx].pipelineStatus === 'Running') {
        const finalStatus: PipelineStatus = Math.random() > 0.15 ? 'Success' : 'Failed';
        this.commits[idx] = { ...this.commits[idx], pipelineStatus: finalStatus };

        // Update corresponding activity
        const act = this.activities.find((a) => a.commit === shortSha && a.action === 'Build');
        if (act) {
          act.outcome = finalStatus === 'Success' ? 'Success' : 'Failed';
        }
      }
    }, 9000);

    return { success: true, commit: updatedCommit };
  }

  getPipelineStatus(buildId: string): { status: PipelineStatus; duration?: string } {
    const commit = this.commits.find((c) => c.buildId === buildId);
    return {
      status: commit?.pipelineStatus || 'Pending',
      duration: '4m 12s',
    };
  }

  getStableEligibility(buildId: string): { eligible: boolean; checks: EligibilityCheck[] } {
    const commit = this.commits.find((c) => c.buildId === buildId);

    if (!commit) {
      return {
        eligible: false,
        checks: [
          {
            id: 'build-exists',
            title: 'Build identification & branch verification',
            status: 'Failed',
            passed: false,
            reason: 'Specified build artifact could not be located in registry',
          },
        ],
      };
    }

    const checks: EligibilityCheck[] = [
      {
        id: 'branch-match',
        title: 'Build belongs to selected product and branch',
        status: 'Passed',
        passed: true,
        reason: `Build matches registered product repository and target branch '${commit.branch}'`,
      },
      {
        id: 'pipeline-success',
        title: 'Mandatory CI/CD validation jobs succeeded',
        status: commit.pipelineStatus === 'Success' ? 'Passed' : commit.pipelineStatus === 'Running' || commit.pipelineStatus === 'Pending' ? 'Pending' : 'Failed',
        passed: commit.pipelineStatus === 'Success',
        reason:
          commit.pipelineStatus === 'Success'
            ? 'All mandatory test stages and SAST analyzers passed'
            : `Pipeline status is currently '${commit.pipelineStatus || 'Unknown'}' (required: Success)`,
      },
      {
        id: 'artifacts-exist',
        title: 'Required release container & binary artifacts exist',
        status: 'Passed',
        passed: true,
        reason: 'Container manifests, SBOM, and package artifacts verified in GitLab Package Registry',
      },
      {
        id: 'not-promoted',
        title: 'Build has not already been promoted to Stable',
        status: !(commit.tags && commit.tags.includes('Stable')) ? 'Passed' : 'Failed',
        passed: !(commit.tags && commit.tags.includes('Stable')),
        reason:
          commit.tags && commit.tags.includes('Stable')
            ? 'This exact build has already been promoted to Stable on this branch'
            : 'Build has not yet been marked Stable on this branch',
      },
      {
        id: 'eligibility-result',
        title: 'Latest eligibility evaluation result is available',
        status: 'Passed',
        passed: true,
        reason: 'Backend promotion policy service returned verified gate evaluation',
      },
    ];

    const eligible = checks.every((c) => c.passed);
    return { eligible, checks };
  }

  promoteStable(
    buildId: string,
    userName: string = 'Current User'
  ): { success: boolean; record: StableRecord } {
    const commit = this.commits.find((c) => c.buildId === buildId);
    if (!commit) {
      throw new Error('Build not found');
    }

    const eligibility = this.getStableEligibility(buildId);
    if (!eligibility.eligible) {
      const failingReasons = eligibility.checks
        .filter((c) => !c.passed)
        .map((c) => c.reason)
        .join('; ');
      throw new Error(`Promotion rejected: ${failingReasons}`);
    }

    // Demote existing current stable on this product & branch
    this.stableRecords.forEach((r) => {
      if (r.productId === commit.productId && r.branch === commit.branch) {
        if (r.isCurrent) {
          r.isCurrent = false;
          r.isPrevious = true;
        } else if (r.isPrevious) {
          r.isPrevious = false;
        }
      }
    });

    const newRecord: StableRecord = {
      id: `st-${Date.now()}`,
      productId: commit.productId,
      branch: commit.branch,
      version: commit.version || `${commit.productId}-${commit.shortSha}`,
      commitSha: commit.sha,
      shortSha: commit.shortSha,
      promotedBy: userName,
      promotedAt: new Date().toISOString(),
      result: 'Success',
      isCurrent: true,
    };

    this.stableRecords.unshift(newRecord);

    // Add tag to commit
    const currentTags = commit.tags || [];
    if (!currentTags.includes('Stable')) {
      commit.tags = [...currentTags, 'Stable'];
    }

    // Add to activity
    const prod = this.products.find((p) => p.id === commit.productId);
    this.activities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userName,
      action: 'Promote Stable',
      product: prod ? prod.code : commit.productId.toUpperCase(),
      branch: commit.branch,
      commit: commit.shortSha,
      version: newRecord.version,
      outcome: 'Success',
    });

    return { success: true, record: newRecord };
  }

  getStableHistory(productId: string, branch?: string): StableRecord[] {
    let list = this.stableRecords.filter((r) => r.productId === productId);
    if (branch && branch !== 'all') {
      list = list.filter((r) => r.branch === branch);
    }
    return [...list];
  }

  getReleases(productId: string): ReleaseRecord[] {
    return this.releases.filter((r) => r.productId === productId);
  }

  createRelease(
    stableBuildId: string,
    userName: string = 'Release Engineer'
  ): ReleaseRecord {
    const stable = this.stableRecords.find((s) => s.id === stableBuildId);
    if (!stable) {
      throw new Error('Selected Stable build was not found');
    }

    const releaseVersion = `${stable.version.replace('-stable', '')}-GA`;
    const newRelease: ReleaseRecord = {
      id: `rel-${Date.now()}`,
      productId: stable.productId,
      branch: stable.branch,
      version: releaseVersion,
      sourceStableBuildId: stable.id,
      releaseStatus: 'Running',
      signingStatus: 'Not Started',
      repackagingStatus: 'Not Started',
      startedBy: userName,
      startedAt: new Date().toISOString(),
    };

    this.releases.unshift(newRelease);

    // Mark commit as Released tag as well
    const commit = this.commits.find((c) => c.sha === stable.commitSha);
    if (commit) {
      const currentTags = commit.tags || [];
      if (!currentTags.includes('Released')) {
        commit.tags = [...currentTags, 'Released'];
      }
    }

    // Activity log
    const prod = this.products.find((p) => p.id === stable.productId);
    this.activities.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userName,
      action: 'Release',
      product: prod ? prod.code : stable.productId.toUpperCase(),
      branch: stable.branch,
      commit: stable.shortSha,
      version: releaseVersion,
      outcome: 'In Progress',
    });

    // Simulate multi-step release flow
    // Step 1: Release Build finishes in 3s -> Signing begins
    setTimeout(() => {
      const r = this.releases.find((rel) => rel.id === newRelease.id);
      if (r) {
        r.releaseStatus = 'Success';
        r.signingStatus = 'Running';
      }
    }, 3000);

    // Step 2: Signing finishes in 7s -> Repackaging begins
    setTimeout(() => {
      const r = this.releases.find((rel) => rel.id === newRelease.id);
      if (r) {
        r.signingStatus = 'Success';
        r.repackagingStatus = 'Running';
      }
    }, 7000);

    // Step 3: Repackaging finishes in 11s -> Release Ready
    setTimeout(() => {
      const r = this.releases.find((rel) => rel.id === newRelease.id);
      if (r) {
        r.repackagingStatus = 'Success';
        r.completedAt = new Date().toISOString();
        const act = this.activities.find(
          (a) => a.action === 'Release' && a.version === releaseVersion
        );
        if (act) act.outcome = 'Success';
      }
    }, 11000);

    return newRelease;
  }

  retryReleaseStep(releaseId: string, step: 'signing' | 'repackaging'): ReleaseRecord {
    const release = this.releases.find((r) => r.id === releaseId);
    if (!release) {
      throw new Error('Release record not found');
    }

    if (step === 'repackaging') {
      release.repackagingStatus = 'Running';
      release.errorMessage = undefined;

      setTimeout(() => {
        const r = this.releases.find((rel) => rel.id === releaseId);
        if (r) {
          r.repackagingStatus = 'Success';
          r.completedAt = new Date().toISOString();
        }
      }, 4000);
    } else if (step === 'signing') {
      release.signingStatus = 'Running';
      release.errorMessage = undefined;

      setTimeout(() => {
        const r = this.releases.find((rel) => rel.id === releaseId);
        if (r) {
          r.signingStatus = 'Success';
          r.repackagingStatus = 'Running';
          setTimeout(() => {
            if (r) {
              r.repackagingStatus = 'Success';
              r.completedAt = new Date().toISOString();
            }
          }, 4000);
        }
      }, 3000);
    }

    return release;
  }

  getActivity(filters?: {
    product?: string;
    branch?: string;
    action?: string;
    status?: string;
    query?: string;
    dateRange?: string;
  }): AuditEntry[] {
    let results = [...this.activities];

    if (filters?.product && filters.product !== 'All') {
      results = results.filter(
        (a) => a.product.toLowerCase() === filters.product?.toLowerCase()
      );
    }

    if (filters?.branch && filters.branch !== 'All') {
      results = results.filter((a) => a.branch === filters.branch);
    }

    if (filters?.action && filters.action !== 'All') {
      results = results.filter((a) => a.action === filters.action);
    }

    if (filters?.status && filters.status !== 'All') {
      results = results.filter((a) => a.outcome === filters.status);
    }

    if (filters?.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (a) =>
          a.user.toLowerCase().includes(q) ||
          a.commit.toLowerCase().includes(q) ||
          a.version.toLowerCase().includes(q) ||
          a.branch.toLowerCase().includes(q)
      );
    }

    return results;
  }

  private startPipelineProgressSimulation() {
    // Periodically update any in-flight Running commits to completion
    setInterval(() => {
      const runningCommits = this.commits.filter((c) => c.pipelineStatus === 'Running');
      if (runningCommits.length > 0) {
        // Change one to Success
        const target = runningCommits[0];
        target.pipelineStatus = 'Success';
      }
    }, 15000);
  }
}

export const mockStore = new MockDataStore();
