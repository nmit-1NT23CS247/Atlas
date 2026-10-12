import { AuditEntry, ActivityFilterParams } from '../types/index.ts';
import { mockStore } from '../mocks/mockStore.ts';
import { USE_MOCK, request } from './apiClient.ts';

export async function getActivity(filters?: ActivityFilterParams): Promise<AuditEntry[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.getActivity(filters);
  }

  const searchParams = new URLSearchParams();
  if (filters?.product) searchParams.set('product', filters.product);
  if (filters?.branch) searchParams.set('branch', filters.branch);
  if (filters?.action) searchParams.set('action', filters.action);
  if (filters?.status) searchParams.set('status', filters.status);
  if (filters?.query) searchParams.set('q', filters.query);
  if (filters?.dateRange) searchParams.set('dateRange', filters.dateRange);

  return request<AuditEntry[]>(`/activity?${searchParams.toString()}`);
}
