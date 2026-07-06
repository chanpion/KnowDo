import apiClient from './api-client';

export const tagApi = {
  list: () =>
    apiClient.post('/api/tag', { action: 'list' }),

  create: (name: string, color: string, group?: string) =>
    apiClient.post('/api/tag', { action: 'create', name, color, group }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.post('/api/tag', { action: 'update', id, ...data }),

  delete: (id: string) =>
    apiClient.post('/api/tag', { action: 'delete', id }),
};
