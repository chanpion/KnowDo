import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '@/services/tag-api';

export const tagKeys = {
  all: ['tags'] as const,
};

export function useTagList() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: () => tagApi.list(),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, group }: { name: string; color: string; group?: string }) =>
      tagApi.create(name, color, group),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      tagApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}
