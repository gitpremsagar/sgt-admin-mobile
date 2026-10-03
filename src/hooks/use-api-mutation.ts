import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { getErrorMessage } from '@/lib/api/errors';
import { toast } from '@/stores/toast';

type Options<TVars, TData> = {
  successMessage?: string | ((data: TData, vars: TVars) => string);
  invalidate?: QueryKey[];
  onSuccess?: (data: TData, vars: TVars) => void;
};

/** Mutation with toast feedback and cache invalidation. */
export function useApiMutation<TVars = void, TData = unknown>(
  fn: (vars: TVars) => Promise<TData>,
  { successMessage, invalidate, onSuccess }: Options<TVars, TData> = {}
) {
  const qc = useQueryClient();
  return useMutation<TData, unknown, TVars>({
    mutationFn: fn,
    onSuccess: async (data, vars) => {
      if (invalidate?.length) {
        await Promise.all(invalidate.map((key) => qc.invalidateQueries({ queryKey: key })));
      }
      if (successMessage) {
        toast.success(typeof successMessage === 'function' ? successMessage(data, vars) : successMessage);
      }
      onSuccess?.(data, vars);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
