import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui';

/** Renders loading / error / not-found states for a single-record query. */
export function QueryBoundary<T>({
  query,
  children,
  notFound = 'Not found',
}: {
  query: UseQueryResult<T | null | undefined>;
  children: (data: T) => ReactNode;
  notFound?: string;
}) {
  if (query.isLoading) return <LoadingState />;
  if (query.error) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (query.data == null) return <EmptyState title={notFound} icon="search" />;
  return <>{children(query.data)}</>;
}
