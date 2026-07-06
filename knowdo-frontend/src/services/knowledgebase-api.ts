import apiClient from './api-client';
import type { PaginatedData } from './types';

export interface KnowledgeBaseListParams {
  folder_id?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
}

export const knowledgeBaseApi = {
  // 知识库 CRUD
  list: (params?: KnowledgeBaseListParams): Promise<PaginatedData<unknown>> =>
    apiClient.post('/api/knowledge', { action: 'list', ...params }),

  create: (data: {
    name: string;
    description?: string;
    type?: string;
    folder_id?: string;
    icon?: string;
  }) =>
    apiClient.post('/api/knowledge', { action: 'create', ...data }),

  detail: (id: string) =>
    apiClient.post('/api/knowledge', { action: 'detail', id }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.post('/api/knowledge', { action: 'update', id, ...data }),

  delete: (id: string) =>
    apiClient.post('/api/knowledge', { action: 'delete', id }),

  // 文档管理
  listDocuments: (knowledgeId: string) =>
    apiClient.post('/api/knowledge', { action: 'doc_list', knowledge_id: knowledgeId }),

  getDocument: (knowledgeId: string, docId: string) =>
    apiClient.post('/api/knowledge', { action: 'doc_detail', knowledge_id: knowledgeId, doc_id: docId }),

  deleteDocument: (knowledgeId: string, docId: string) =>
    apiClient.post('/api/knowledge', { action: 'doc_delete', knowledge_id: knowledgeId, doc_id: docId }),

  getChunks: (knowledgeId: string, docId: string) =>
    apiClient.post('/api/knowledge', { action: 'doc_chunks', knowledge_id: knowledgeId, doc_id: docId }),

  rechunkDocument: (knowledgeId: string, docId: string, params?: {
    chunk_mode?: string;
    chunk_size?: number;
    chunk_overlap?: number;
  }) =>
    apiClient.post('/api/knowledge', { action: 'doc_rechunk', knowledge_id: knowledgeId, doc_id: docId, ...params }),

  // 文档上传 (multipart)
  uploadDocument: (knowledgeId: string, file: File) => {
    const formData = new FormData();
    formData.append('knowledge_id', knowledgeId);
    formData.append('file', file);
    return apiClient.post('/api/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 召回测试
  recallTest: (knowledgeId: string, query: string, topK?: number, searchMode?: string) =>
    apiClient.post('/api/knowledge', { action: 'recall_test', knowledge_id: knowledgeId, query, top_k: topK, search_mode: searchMode }),

  // 文件夹管理
  listFolders: () =>
    apiClient.post('/api/knowledge', { action: 'folder_list' }),

  createFolder: (name: string, parentId?: string | null) =>
    apiClient.post('/api/knowledge', { action: 'folder_create', name, parent_id: parentId }),

  renameFolder: (id: string, name: string) =>
    apiClient.post('/api/knowledge', { action: 'folder_rename', id, name }),

  deleteFolder: (id: string) =>
    apiClient.post('/api/knowledge', { action: 'folder_delete', id }),

  moveFolder: (id: string, targetParentId: string | null) =>
    apiClient.post('/api/knowledge', { action: 'folder_move', id, target_parent_id: targetParentId }),

  // 授权管理
  listAuth: (knowledgeId: string) =>
    apiClient.post('/api/knowledge', { action: 'auth_list', knowledge_id: knowledgeId }),

  createAuth: (data: {
    knowledge_id: string;
    target_type: string;
    target_id: string;
    target_name: string;
    permission: string;
  }) =>
    apiClient.post('/api/knowledge', { action: 'auth_create', ...data }),

  deleteAuth: (id: string) =>
    apiClient.post('/api/knowledge', { action: 'auth_delete', id }),
};
