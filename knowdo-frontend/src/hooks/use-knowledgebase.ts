import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeBaseApi, type KnowledgeBaseListParams } from '@/services/knowledgebase-api';

export const knowledgeBaseKeys = {
  all: ['knowledgeBases'] as const,
  list: (filters?: KnowledgeBaseListParams) => ['knowledgeBases', 'list', filters] as const,
  detail: (id: string) => ['knowledgeBases', 'detail', id] as const,
  folders: () => ['knowledgeBases', 'folders'] as const,
  documents: (kbId: string) => ['knowledgeBases', 'documents', kbId] as const,
  chunks: (kbId: string, docId: string) => ['knowledgeBases', 'chunks', kbId, docId] as const,
  auth: (kbId: string) => ['knowledgeBases', 'auth', kbId] as const,
};

export function useKnowledgeBaseList(filters?: KnowledgeBaseListParams) {
  return useQuery({
    queryKey: knowledgeBaseKeys.list(filters),
    queryFn: () => knowledgeBaseApi.list(filters),
  });
}

export function useKnowledgeBaseDetail(id: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.detail(id),
    queryFn: () => knowledgeBaseApi.detail(id),
    enabled: !!id,
  });
}

export function useCreateKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: knowledgeBaseApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.all });
    },
  });
}

export function useUpdateKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      knowledgeBaseApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.all });
    },
  });
}

export function useDeleteKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: knowledgeBaseApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.all });
    },
  });
}

export function useKnowledgeFolders() {
  return useQuery({
    queryKey: knowledgeBaseKeys.folders(),
    queryFn: () => knowledgeBaseApi.listFolders(),
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string | null }) =>
      knowledgeBaseApi.createFolder(name, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.folders() });
    },
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      knowledgeBaseApi.renameFolder(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.folders() });
    },
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.folders() });
    },
  });
}

export function useMoveFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetParentId }: { id: string; targetParentId: string | null }) =>
      knowledgeBaseApi.moveFolder(id, targetParentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.folders() });
    },
  });
}

export function useKnowledgeDocuments(kbId: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.documents(kbId),
    queryFn: () => knowledgeBaseApi.listDocuments(kbId),
    enabled: !!kbId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kbId, file }: { kbId: string; file: File }) =>
      knowledgeBaseApi.uploadDocument(kbId, file),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(variables.kbId) });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kbId, docId }: { kbId: string; docId: string }) =>
      knowledgeBaseApi.deleteDocument(kbId, docId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(variables.kbId) });
    },
  });
}

export function useDocumentChunks(kbId: string, docId: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.chunks(kbId, docId),
    queryFn: () => knowledgeBaseApi.getChunks(kbId, docId),
    enabled: !!kbId && !!docId,
  });
}

export function useRechunkDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kbId, docId, ...params }: {
      kbId: string;
      docId: string;
      chunk_mode?: string;
      chunk_size?: number;
      chunk_overlap?: number;
    }) => knowledgeBaseApi.rechunkDocument(kbId, docId, params),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.chunks(variables.kbId, variables.docId) });
    },
  });
}

export function useRecallTest() {
  return useMutation({
    mutationFn: ({ kbId, query, topK, searchMode }: {
      kbId: string;
      query: string;
      topK?: number;
      searchMode?: string;
    }) => knowledgeBaseApi.recallTest(kbId, query, topK, searchMode),
  });
}

export function useKnowledgeAuth(kbId: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.auth(kbId),
    queryFn: () => knowledgeBaseApi.listAuth(kbId),
    enabled: !!kbId,
  });
}

export function useCreateAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: knowledgeBaseApi.createAuth,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: knowledgeBaseKeys.auth(variables.knowledge_id) });
    },
  });
}

export function useDeleteAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.deleteAuth(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledgeBases', 'auth'] });
    },
  });
}
