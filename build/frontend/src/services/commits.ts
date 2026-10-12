import { Commit, PipelineStatus, Tag } from '../types/index.ts';
import { mockStore } from '../mocks/mockStore.ts';
import { USE_MOCK, request } from './apiClient.ts';

export async function getCommits(
  productId: string,
  branch: string,
  query?: string,
  filters?: {
    status?: PipelineStatus | 'All';
    tag?: Tag | 'All';
    dateRange?: string;
  }
): Promise<Commit[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 140));
    return mockStore.getCommits(
      productId,
      branch,
      query,
      filters?.status,
      filters?.tag,
      filters?.dateRange
    );
  }

  const searchParams = new URLSearchParams({
    productId,
    branch,
  });
  if (query) searchParams.set('q', query);
  if (filters?.status) searchParams.set('status', filters.status);
  if (filters?.tag) searchParams.set('tag', filters.tag);
  if (filters?.dateRange) searchParams.set('dateRange', filters.dateRange);

  return request<Commit[]>(`/commits?${searchParams.toString()}`);
}
