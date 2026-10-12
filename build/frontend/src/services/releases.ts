import { ReleaseRecord } from '../types/index.ts';
import { mockStore } from '../mocks/mockStore.ts';
import { USE_MOCK, request } from './apiClient.ts';

export async function createRelease(
  stableBuildId: string,
  userName: string = 'Release Engineer'
): Promise<ReleaseRecord> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return mockStore.createRelease(stableBuildId, userName);
  }

  return request<ReleaseRecord>('/releases', {
    method: 'POST',
    body: JSON.stringify({ stableBuildId, userName }),
  });
}

export async function getReleases(productId: string): Promise<ReleaseRecord[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.getReleases(productId);
  }

  return request<ReleaseRecord[]>(`/releases?productId=${productId}`);
}

export async function retryReleaseStep(
  releaseId: string,
  step: 'signing' | 'repackaging'
): Promise<ReleaseRecord> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockStore.retryReleaseStep(releaseId, step);
  }

  return request<ReleaseRecord>(`/releases/${releaseId}/retry`, {
    method: 'POST',
    body: JSON.stringify({ step }),
  });
}
