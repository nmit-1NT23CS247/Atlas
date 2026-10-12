import { Product, Branch } from '../types/index.ts';
import { mockStore } from '../mocks/mockStore.ts';
import { USE_MOCK, request } from './apiClient.ts';

export async function getProducts(): Promise<Product[]> {
  if (USE_MOCK) {
    // Artificial small latency to simulate real network for skeleton demonstration
    await new Promise((r) => setTimeout(r, 120));
    return mockStore.getProducts();
  }
  return request<Product[]>('/products');
}

export async function getBranches(productId: string): Promise<Branch[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    return mockStore.getBranches(productId);
  }
  return request<Branch[]>(`/products/${productId}/branches`);
}
