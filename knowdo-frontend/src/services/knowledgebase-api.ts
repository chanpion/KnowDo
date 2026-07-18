import apiClient from './api-client';
import type { PaginatedData } from './types';
import type { KnowledgeBase } from '@/types';

// 后端返回 snake_case 字段，且列表不携带 documents，这里统一适配为前端 KnowledgeBase 类型
function mapKnowledgeBase(raw: any): KnowledgeBase {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    tags: raw.tags ?? [],
    type: (raw.type ?? 'general') as KnowledgeBase['type'],
    vectorModel: raw.vector_model ?? '',
    webUrl: raw.web_url,
    webSelector: raw.web_selector,
    feishuAppId: raw.feishu_app_id,
    feishuFolderToken: raw.feishu_folder_token,
    status: (raw.status ?? 'pending') as KnowledgeBase['status'],
    documents: raw.documents ?? [],
    folderId: raw.folder_id ?? '',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    chunkStrategy: raw.chunk_strategy,
    uploadRule: raw.upload_rule,
    documentCount: raw.document_count,
    charCount: raw.chunk_count,
    icon: raw.icon,
    permission: raw.permission,
    indexMode: raw.index_mode,
    embeddingModel: raw.embedding_model,
    searchMode: raw.search_mode,
    topK: raw.top_k,
    scoreThreshold: raw.score_threshold,
    enableRerank: raw.enable_rerank,
    rerankModel: raw.rerank_model,
  };
}

export interface KnowledgeBaseListParams {
  folder_id?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
}

export const knowledgeBaseApi = {
  // 知识库 CRUD
  list: async (params?: KnowledgeBaseListParams): Promise<PaginatedData<KnowledgeBase>> => {
    const res = await apiClient.post('/api/knowledge', { action: 'list', ...params });
    const items = (res?.items || []) as any[];
    return {
      items: items.map(mapKnowledgeBase),
      total: res?.total ?? items.length,
      page: res?.page ?? 1,
      size: res?.size ?? items.length,
    };
  },

  create: (data: {
    name: string;
    description?: string;
    type?: string;
    folder_id?: string;
    icon?: string;
  }) =>
    apiClient.post('/api/knowledge', { action: 'create', ...data }),

  detail: async (id: string): Promise<KnowledgeBase> =>
    mapKnowledgeBase(await apiClient.post('/api/knowledge', { action: 'detail', id })),

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
