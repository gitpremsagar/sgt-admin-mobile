import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Icon, Skeleton, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListScreenProps<T> = {
  data: T[] | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  error?: unknown;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  header?: ReactElement | null;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: IconName;
  fab?: { icon?: IconName; onPress: () => void; label?: string };
  footer?: ReactNode;
};

export function ListScreen<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading,
  error,
  refreshing = false,
  onRefresh,
  onEndReached,
  loadingMore,
  header,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  fab,
  footer,
}: ListScreenProps<T>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlashList
        data={isLoading || error ? [] : (data ?? [])}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six + insets.bottom }}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header ? <View style={{ marginBottom: Spacing.three, gap: Spacing.two }}>{header}</View> : null}
        ListEmptyComponent={
          isLoading ? (
            <Skeleton count={6} />
          ) : error ? (
            <ErrorState error={error} onRetry={onRefresh} />
          ) : (
            <EmptyState title={emptyTitle} message={emptyMessage} icon={emptyIcon} />
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ margin: Spacing.three }} color={theme.primary} /> : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          ) : undefined
        }
      />
      {footer}
      {fab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fab.label ?? 'Add'}
          onPress={fab.onPress}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.primary, bottom: Spacing.four + insets.bottom, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Icon name={fab.icon ?? 'add'} size={28} color={theme.primaryText} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Separator() {
  return <View style={{ height: Spacing.two }} />;
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: 58,
    height: 58,
    borderRadius: Radius.lg + 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
