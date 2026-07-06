import apiClient from './api-client';

export const categoryApi = {
  list: () =>
    apiClient.post('/api/category', { action: 'list' }),

  create: (name: string, parentId?: string | null, icon?: string) =>
    apiClient.post('/api/category', { action: 'create', name, parent_id: parentId, icon }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.post('/api/category', { action: 'update', id, ...data }),

  delete: (id: string) =>
    apiClient.post('/api/category', { action: 'delete', id }),
};
