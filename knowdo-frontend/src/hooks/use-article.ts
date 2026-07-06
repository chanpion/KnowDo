import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articleApi, type ArticleListParams } from '@/services/article-api';

export const articleKeys = {
  all: ['articles'] as const,
  list: (filters?: ArticleListParams) => ['articles', 'list', filters] as const,
  detail: (id: string) => ['articles', 'detail', id] as const,
  versions: (id: string) => ['articles', 'versions', id] as const,
  hot: ['articles', 'hot'] as const,
  latest: ['articles', 'latest'] as const,
  reviewQueue: ['articles', 'reviewQueue'] as const,
  favoriteFolders: ['articles', 'favoriteFolders'] as const,
};

export function useArticleList(filters?: ArticleListParams) {
  return useQuery({
    queryKey: articleKeys.list(filters),
    queryFn: () => articleApi.list(filters),
  });
}

export function useArticleDetail(id: string) {
  return useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => articleApi.detail(id),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articleApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      articleApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articleApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useSoftDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articleApi.softDelete,
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useRestoreArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articleApi.restore,
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId?: string }) =>
      articleApi.toggleLike(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, author, content, authorDept, replyTo }: {
      articleId: string; author: string; content: string; authorDept?: string; replyTo?: string;
    }) => articleApi.addComment(articleId, author, content, authorDept, replyTo),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, commentId }: { articleId: string; commentId: string }) =>
      articleApi.deleteComment(articleId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articleApi.submitReview,
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useApproveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: articleApi.approve,
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useRejectArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      articleApi.reject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useReturnForEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback?: string }) =>
      articleApi.returnForEdit(id, feedback),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: articleKeys.reviewQueue,
    queryFn: () => articleApi.reviewQueue(),
  });
}

export function useArticleVersions(id: string) {
  return useQuery({
    queryKey: articleKeys.versions(id),
    queryFn: () => articleApi.listVersions(id),
    enabled: !!id,
  });
}

export function useRollback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      articleApi.rollback(id, versionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useHotArticles() {
  return useQuery({
    queryKey: articleKeys.hot,
    queryFn: () => articleApi.hot(),
  });
}

export function useLatestArticles() {
  return useQuery({
    queryKey: articleKeys.latest,
    queryFn: () => articleApi.latest(),
  });
}

export function useFavoriteFolders() {
  return useQuery({
    queryKey: articleKeys.favoriteFolders,
    queryFn: () => articleApi.listFavoriteFolders(),
  });
}

export function useCreateFavoriteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => articleApi.createFavoriteFolder(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.favoriteFolders }),
  });
}

export function useRenameFavoriteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      articleApi.renameFavoriteFolder(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.favoriteFolders }),
  });
}

export function useDeleteFavoriteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articleApi.deleteFavoriteFolder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.favoriteFolders }),
  });
}

export function useMoveToFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, folderId }: { articleId: string; folderId: string }) =>
      articleApi.moveToFolder(articleId, folderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

// ============ Archive ============

export function useArchiveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articleApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

export function useUnarchiveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articleApi.unarchive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  });
}

// ============ Recycle ============

export function useDeletedArticles(page = 1, size = 20) {
  return useQuery({
    queryKey: ['articles', 'deleted', page, size],
    queryFn: () => articleApi.listDeleted(page, size),
  });
}

export function useFavoriteFolderArticles(folderId: string, page = 1, size = 20) {
  return useQuery({
    queryKey: ['articles', 'favoriteFolder', folderId, page, size],
    queryFn: () => articleApi.listFavoriteFolderArticles(folderId, page, size),
    enabled: !!folderId,
  });
}
