import apiClient from './api-client';

export const notificationApi = {
  list: (size = 50) =>
    apiClient.post('/api/notification', { action: 'list', size }),

  markRead: (id: string) =>
    apiClient.post('/api/notification', { action: 'mark_read', id }),

  markAllRead: () =>
    apiClient.post('/api/notification', { action: 'mark_all_read' }),
};
