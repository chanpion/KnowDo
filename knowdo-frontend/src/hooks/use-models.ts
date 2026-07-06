import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelApi, type ModelListParams, type ModelCreateData } from '@/services/model-api';

export const modelKeys = {
  all: ['models'] as const,
  list: (filters?: ModelListParams) => ['models', 'list', filters] as const,
  detail: (id: string) => ['models', 'detail', id] as const,
};

export function useModelList(filters?: ModelListParams) {
  return useQuery({
    queryKey: modelKeys.list(filters),
    queryFn: () => modelApi.list(filters),
  });
}

export function useModelDetail(id: string) {
  return useQuery({
    queryKey: modelKeys.detail(id),
    queryFn: () => modelApi.detail(id),
    enabled: !!id,
  });
}

export function useCreateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ModelCreateData) => modelApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function useUpdateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      modelApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function useDeleteModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => modelApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function useTestModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => modelApi.test(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}
