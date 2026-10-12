import { StableRecord, EligibilityCheck } from '../types/index.ts';
import { mockStore } from '../mocks/mockStore.ts';
import { USE_MOCK, request } from './apiClient.ts';

export async function getStableEligibility(
  buildId: string
): Promise<{ eligible: boolean; checks: EligibilityCheck[] }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return mockStore.getStableEligibility(buildId);
  }

  return request<{ eligible: boolean; checks: EligibilityCheck[] }>(
    `/stable/eligibility/${buildId}`
  );
}

export async function promoteStable(
  buildId: string,
  userName: string = 'Release Engineer'
): Promise<{ success: boolean; record: StableRecord }> {
  if (USE_MOCK) {
    // Artificial latency to verify double-click prevention spinner
    await new Promise((r) => setTimeout(r, 650));
    return mockStore.promoteStable(buildId, userName);
  }

  return request<{ success: boolean; record: StableRecord }>('/stable/promote', {
    method: 'POST',
    body: JSON.stringify({ buildId, userName }),
  });
}

export async function getStableHistory(
  productId: string,
  branch?: string
): Promise<StableRecord[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.getStableHistory(productId, branch);
  }

  const query = branch ? `?branch=${encodeURIComponent(branch)}` : '';
  return request<StableRecord[]>(`/stable/${productId}/history${query}`);
}
