import { Commit, PipelineStatus } from '../types/index.ts';
import { mockStore } from '../mocks/mockStore.ts';
import { USE_MOCK, request } from './apiClient.ts';

export async function triggerBuild(
  commitSha: string,
  productId: string,
  branch: string,
  userName: string = 'Current Engineer'
): Promise<{ success: boolean; commit: Commit }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return mockStore.triggerBuild(commitSha, productId, branch, userName);
  }

  return request<{ success: boolean; commit: Commit }>('/builds/trigger', {
    method: 'POST',
    body: JSON.stringify({ commitSha, productId, branch, userName }),
  });
}

export async function getPipelineStatus(
  buildId: string
): Promise<{ status: PipelineStatus; duration?: string }> {
  if (USE_MOCK) {
    return mockStore.getPipelineStatus(buildId);
  }

  return request<{ status: PipelineStatus; duration?: string }>(`/builds/${buildId}/pipeline`);
}
