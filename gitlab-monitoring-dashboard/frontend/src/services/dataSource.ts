import { MOCK_PROJECTS } from '../data/mockProjects';
import { MOCK_PIPELINES } from '../data/mockPipelines';
import { MOCK_JOBS } from '../data/mockJobs';
import { Project, ProjectStats } from '../types/project';
import {
  Pipeline,
  PipelineSummaryMetrics,
} from '../types/pipeline';
import { Job, PipelineStageGroup, StageName, JobStatus } from '../types/job';
import { STAGE_ORDER } from '../lib/constants';

/**
 * In-memory dataset store with clone isolation.
 * Can be swapped with FastAPI / REST API calls seamlessly.
 */
class DataSource {
  private projects: Project[] = [...MOCK_PROJECTS];
  private pipelines: Pipeline[] = [...MOCK_PIPELINES];
  private jobs: Job[] = [...MOCK_JOBS];

  // Projects
  public getProjects(): Project[] {
    return [...this.projects];
  }

  public getProjectById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  public getProjectStats(): ProjectStats[] {
    return this.projects.map((project) => {
      const projectPipelines = this.pipelines.filter(
        (p) => p.projectId === project.id
      );
      const totalPipelines = projectPipelines.length;
      const successCount = projectPipelines.filter(
        (p) => p.status === 'success' && p.finishedAt !== null
      ).length;
      const failedCount = projectPipelines.filter((p) => p.status === 'failed').length;
      const runningCount = projectPipelines.filter((p) => p.status === 'running').length;

      const completedCount = projectPipelines.filter(
        (p) =>
          p.finishedAt !== null &&
          (p.status === 'success' ||
            p.status === 'failed' ||
            p.status === 'canceled')
      ).length;
      const successRate = completedCount > 0 ? (successCount / completedCount) * 100 : 0;

      const completedDurations = projectPipelines
        .filter(
          (p) =>
            p.finishedAt !== null &&
            Number.isFinite(p.durationSeconds) &&
            p.durationSeconds >= 0
        )
        .map((p) => p.durationSeconds);
      const totalDuration = completedDurations.reduce(
        (acc, duration) => acc + duration,
        0
      );
      const avgDurationSeconds =
        completedDurations.length > 0
          ? Math.round(totalDuration / completedDurations.length)
          : 0;

      const sortedByDate = [...projectPipelines].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      const latest = sortedByDate[0];

      return {
        project,
        totalPipelines,
        successCount,
        failedCount,
        runningCount,
        successRate,
        avgDurationSeconds,
        latestPipeline: latest
          ? {
              id: latest.id,
              status: latest.status,
              startedAt: latest.startedAt,
              ref: latest.ref,
            }
          : undefined,
      };
    });
  }

  // Pipelines
  public getPipelines(): Pipeline[] {
    return [...this.pipelines];
  }

  public getPipelineById(id: number): Pipeline | undefined {
    return this.pipelines.find((p) => p.id === id);
  }

  public getSummaryMetrics(): PipelineSummaryMetrics {
    const totalPipelines = this.pipelines.length;
    const successful = this.pipelines.filter((p) => p.status === 'success').length;
    const failed = this.pipelines.filter((p) => p.status === 'failed').length;
    const running = this.pipelines.filter((p) => p.status === 'running').length;
    const canceled = this.pipelines.filter((p) => p.status === 'canceled').length;
    const pending = this.pipelines.filter((p) => p.status === 'pending').length;
    const skipped = this.pipelines.filter((p) => p.status === 'skipped').length;

    const completed = this.pipelines.filter(
      (p) =>
        p.finishedAt !== null &&
        (p.status === 'success' ||
          p.status === 'failed' ||
          p.status === 'canceled')
    ).length;
    const successRate = completed > 0 ? (successful / completed) * 100 : 0;

    const completedDurations = this.pipelines
      .filter(
        (p) =>
          p.finishedAt !== null &&
          Number.isFinite(p.durationSeconds) &&
          p.durationSeconds >= 0
      )
      .map((p) => p.durationSeconds);
    const totalDuration = completedDurations.reduce((sum, duration) => sum + duration, 0);
    const avgDurationSeconds =
      completedDurations.length > 0
        ? Math.round(totalDuration / completedDurations.length)
        : 0;

    return {
      totalPipelines,
      successful,
      failed,
      running,
      canceled,
      pending,
      skipped,
      successRate,
      avgDurationSeconds,
    };
  }

  public getRecentFailedPipelines(limit = 4): {
    pipeline: Pipeline;
    failedJob?: Job;
  }[] {
    const failed = this.pipelines
      .filter((p) => p.status === 'failed')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);

    return failed.map((pipeline) => {
      const failedJob = this.getJobsForPipeline(pipeline.id).find(
        (j) => j.status === 'failed'
      );
      return {
        pipeline,
        failedJob,
      };
    });
  }

  // Jobs
  public getJobsForPipeline(pipelineId: number): Job[] {
    const matchedJobs = this.jobs.filter((j) => j.pipelineId === pipelineId);
    if (matchedJobs.length > 0) {
      return matchedJobs;
    }

    // Generate consistent synthetic jobs for pipelines that don't have explicit mock job entries
    const pipeline = this.getPipelineById(pipelineId);
    if (!pipeline) return [];

    return this.synthesizeJobsForPipeline(pipeline);
  }

  public getStageGroupsForPipeline(pipelineId: number): PipelineStageGroup[] {
    const jobs = this.getJobsForPipeline(pipelineId);
    const stageMap = new Map<StageName, Job[]>();

    jobs.forEach((job) => {
      const list = stageMap.get(job.stage) || [];
      list.push(job);
      stageMap.set(job.stage, list);
    });

    const groups: PipelineStageGroup[] = [];

    const stageOrderKeys: StageName[] = [
      'prepare',
      'build',
      'test',
      'security',
      'package',
      'deploy',
    ];

    stageOrderKeys.forEach((stageName) => {
      const stageJobs = stageMap.get(stageName);
      if (!stageJobs || stageJobs.length === 0) return;

      const totalJobs = stageJobs.length;
      const passedJobs = stageJobs.filter((j) => j.status === 'success').length;
      const failedJobs = stageJobs.filter((j) => j.status === 'failed').length;
      const runningJobs = stageJobs.filter((j) => j.status === 'running').length;
      const pendingJobs = stageJobs.filter((j) => j.status === 'pending').length;

      let status: JobStatus = 'success';
      if (failedJobs > 0) status = 'failed';
      else if (runningJobs > 0) status = 'running';
      else if (pendingJobs > 0) status = 'pending';
      else if (passedJobs === totalJobs) status = 'success';

      const durationSeconds = stageJobs.reduce((sum, j) => sum + j.durationSeconds, 0);

      groups.push({
        name: stageName,
        status,
        order: STAGE_ORDER[stageName] || 99,
        jobs: stageJobs,
        totalJobs,
        passedJobs,
        failedJobs,
        durationSeconds,
      });
    });

    return groups.sort((a, b) => a.order - b.order);
  }

  private synthesizeJobsForPipeline(pipeline: Pipeline): Job[] {
    const isFailed = pipeline.status === 'failed';
    const isRunning = pipeline.status === 'running';

    const baseJobs: { name: string; stage: StageName; baseDuration: number }[] = [
      { name: 'setup-environment', stage: 'prepare', baseDuration: 40 },
      { name: 'compile-artifacts', stage: 'build', baseDuration: 85 },
      { name: 'docker-build-image', stage: 'build', baseDuration: 110 },
      { name: 'unit-test-suite', stage: 'test', baseDuration: 130 },
      { name: 'integration-tests', stage: 'test', baseDuration: 170 },
      { name: 'vulnerability-scanner', stage: 'security', baseDuration: 65 },
      { name: 'helm-package', stage: 'package', baseDuration: 45 },
      { name: 'deploy-cluster', stage: 'deploy', baseDuration: 55 },
    ];

    return baseJobs.map((template, idx) => {
      let jobStatus: JobStatus = 'success';
      let duration = template.baseDuration;
      let failureMessage: string | undefined = undefined;

      if (isFailed && idx === 4) {
        // Failed at integration tests
        jobStatus = 'failed';
        duration = 210;
        failureMessage = `Test execution failed: Assertion error in ${pipeline.projectName} distributed contract check`;
      } else if (isFailed && idx > 4) {
        jobStatus = 'skipped';
        duration = 0;
      } else if (isRunning && idx === 3) {
        jobStatus = 'running';
        duration = 45;
      } else if (isRunning && idx > 3) {
        jobStatus = 'pending';
        duration = 0;
      }

      return {
        id: pipeline.id * 10 + idx + 1,
        pipelineId: pipeline.id,
        projectId: pipeline.projectId,
        projectName: pipeline.projectName,
        name: template.name,
        stage: template.stage,
        status: jobStatus,
        startedAt: pipeline.startedAt,
        finishedAt: jobStatus === 'running' || jobStatus === 'pending' ? null : pipeline.finishedAt,
        durationSeconds: duration,
        runnerName: `gitlab-runner-cloud-pool-0${(idx % 3) + 1}`,
        runnerTags: ['docker', 'linux'],
        failureMessage,
      };
    });
  }
}

export const dataSource = new DataSource();
