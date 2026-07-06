import apiClient from './api-client';
import type { PaginatedData } from './types';

export interface ModelListParams {
  provider?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface ModelCreateData {
  name: string;
  provider: string;
  type: string;
  api_url: string;
  api_key: string;
  model_name: string;
  max_tokens?: number;
  concurrency?: number;
  timeout?: number;
  retry?: number;
}

export const modelApi = {
  list: (params?: ModelListParams): Promise<PaginatedData<unknown>> =>
    apiClient.post('/api/model', { action: 'list', ...params }),

  create: (data: ModelCreateData) =>
    apiClient.post('/api/model', { action: 'create', ...data }),

  detail: (id: string) =>
    apiClient.post('/api/model', { action: 'detail', id }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.post('/api/model', { action: 'update', id, ...data }),

  delete: (id: string) =>
    apiClient.post('/api/model', { action: 'delete', id }),

  test: (id: string): Promise<{ success: boolean; latency: string; error?: string }> =>
    apiClient.post('/api/model', { action: 'test', id }),
};
