import { useMemo, useState, type ReactNode } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { IconButton } from './button';
import { Icon } from './icon';
import { SearchBar } from './input';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  fullHeight?: boolean;
};

export function Sheet({ visible, onClose, title, children, footer, scroll = true, fullHeight }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + Spacing.two,
              height: fullHeight ? '90%' : undefined,
              maxHeight: '90%',
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />
          <View style={styles.header}>
            <ThemedText type="subtitle" style={{ flex: 1 }} numberOfLines={1}>
              {title}
            </ThemedText>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" />
          </View>
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
              style={fullHeight ? { flex: 1 } : undefined}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.body, { flex: fullHeight ? 1 : undefined }]}>{children}</View>
          )}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type Option<T extends string = string> = { value: T; label: string; description?: string };

type SelectFieldProps<T extends string> = {
  label?: string;
  value: T | null | undefined;
  options: Option<T>[];
  onChange: (value: T | null) => void;
  placeholder?: string;
  searchable?: boolean;
  allowClear?: boolean;
  error?: string;
  disabled?: boolean;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchable = options.length > 8,
  allowClear,
  error,
  disabled,
}: SelectFieldProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)
    );
  }, [options, query]);

  return (
    <View style={{ gap: Spacing.one }}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: theme.card,
            borderColor: error ? theme.danger : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        <ThemedText
          numberOfLines={1}
          style={{ flex: 1 }}
          themeColor={selected ? 'text' : 'textSecondary'}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <Icon name="expand_more" size={20} color={theme.textSecondary} />
      </Pressable>
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Select'} scroll={false} fullHeight={options.length > 10}>
        {searchable ? <SearchBar value={query} onChangeText={setQuery} /> : null}
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.value}
          keyboardShouldPersistTaps="handled"
          style={{ flexGrow: 0 }}
          ListHeaderComponent={
            allowClear && value ? (
              <OptionRow
                label="Clear selection"
                selected={false}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <OptionRow
              label={item.label}
              description={item.description}
              selected={item.value === value}
              onPress={() => {
                onChange(item.value);
                setOpen(false);
                setQuery('');
              }}
            />
          )}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={{ padding: Spacing.three }}>
              No matches
            </ThemedText>
          }
        />
      </Sheet>
    </View>
  );
}

function OptionRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundElement : 'transparent' },
      ]}>
      <View style={{ flex: 1 }}>
        <ThemedText type={selected ? 'heading' : 'default'}>{label}</ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      {selected ? <Icon name="check" size={20} color={theme.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    marginTop: 'auto',
    borderTopLeftRadius: Radius.lg + 4,
    borderTopRightRadius: Radius.lg + 4,
    paddingTop: Spacing.two,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  body: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.three },
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three - 4,
    minHeight: 46,
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
