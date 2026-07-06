import apiClient from './api-client';
import type { PaginatedData } from './types';

export interface ArticleListParams {
  category_id?: string;
  status?: string;
  type?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export const articleApi = {
  list: (params?: ArticleListParams): Promise<PaginatedData<unknown>> =>
    apiClient.post('/api/article', { action: 'list', ...params }),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/api/article', { action: 'create', ...data }),

  detail: (id: string) =>
    apiClient.post('/api/article', { action: 'detail', id }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.post('/api/article', { action: 'update', id, ...data }),

  delete: (id: string) =>
    apiClient.post('/api/article', { action: 'delete', id }),

  softDelete: (id: string) =>
    apiClient.post('/api/article', { action: 'soft_delete', id }),

  restore: (id: string) =>
    apiClient.post('/api/article', { action: 'restore', id }),

  archive: (id: string) =>
    apiClient.post('/api/article', { action: 'archive', id }),

  unarchive: (id: string) =>
    apiClient.post('/api/article', { action: 'unarchive', id }),

  toggleLike: (id: string, userId = 'default') =>
    apiClient.post('/api/article', { action: 'toggle_like', id, user_id: userId }),

  addComment: (articleId: string, author: string, content: string, authorDept = '', replyTo?: string) =>
    apiClient.post('/api/article', { action: 'add_comment', id: articleId, author, author_dept: authorDept, content, reply_to: replyTo }),

  deleteComment: (articleId: string, commentId: string) =>
    apiClient.post('/api/article', { action: 'delete_comment', id: articleId, comment_id: commentId }),

  submitReview: (id: string) =>
    apiClient.post('/api/article', { action: 'submit_review', id }),

  approve: (id: string) =>
    apiClient.post('/api/article', { action: 'approve', id }),

  reject: (id: string, reason: string) =>
    apiClient.post('/api/article', { action: 'reject', id, reason }),

  returnForEdit: (id: string, feedback = '') =>
    apiClient.post('/api/article', { action: 'return_for_edit', id, feedback }),

  reviewQueue: () =>
    apiClient.post('/api/article', { action: 'review_queue' }),

  listVersions: (id: string) =>
    apiClient.post('/api/article', { action: 'list_versions', id }),

  rollback: (id: string, versionId: string) =>
    apiClient.post('/api/article', { action: 'rollback', id, version_id: versionId }),

  hot: (limit = 10) =>
    apiClient.post('/api/article', { action: 'hot', limit }),

  latest: (limit = 10) =>
    apiClient.post('/api/article', { action: 'latest', limit }),

  // Favorite folders (integrated in article module)
  listFavoriteFolders: () =>
    apiClient.post('/api/article', { action: 'favorite_folder_list' }),

  createFavoriteFolder: (name: string) =>
    apiClient.post('/api/article', { action: 'favorite_folder_create', name }),

  renameFavoriteFolder: (id: string, name: string) =>
    apiClient.post('/api/article', { action: 'favorite_folder_rename', id, name }),

  deleteFavoriteFolder: (id: string) =>
    apiClient.post('/api/article', { action: 'favorite_folder_delete', id }),

  moveToFolder: (articleId: string, folderId: string) =>
    apiClient.post('/api/article', { action: 'move_to_folder', id: articleId, folder_id: folderId }),

  // Recycle
  listDeleted: (page = 1, size = 20) =>
    apiClient.post('/api/article', { action: 'recycle_list', page, size }),

  // Favorite folder articles
  listFavoriteFolderArticles: (folderId: string, page = 1, size = 20) =>
    apiClient.post('/api/article', { action: 'favorite_folder_articles', folder_id: folderId, page, size }),
};
