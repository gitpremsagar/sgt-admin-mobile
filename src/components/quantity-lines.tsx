import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Icon, IconButton } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type QtyLine = {
  productId: string;
  name: string;
  code?: string;
  quantity: number;
  /** Optional cap (e.g. ordered quantity for returns). */
  max?: number;
  note?: string;
};

export function QuantityLines({
  lines,
  onChange,
  onAdd,
  addLabel = 'Add products',
  unit = 'CB',
  allowZero,
}: {
  lines: QtyLine[];
  onChange: (lines: QtyLine[]) => void;
  onAdd?: () => void;
  addLabel?: string;
  unit?: string;
  allowZero?: boolean;
}) {
  const theme = useTheme();
  const update = (productId: string, quantity: number) =>
    onChange(lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  const remove = (productId: string) => onChange(lines.filter((l) => l.productId !== productId));
  const min = allowZero ? 0 : 1;

  return (
    <View style={{ gap: Spacing.two }}>
      {lines.map((l) => {
        const clamp = (n: number) => Math.max(min, l.max != null ? Math.min(l.max, n) : n);
        return (
          <Card key={l.productId} style={{ paddingVertical: Spacing.two + 2 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <ThemedText type="heading" numberOfLines={2}>
                  {l.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {[l.code, l.max != null ? `max ${l.max}` : null, l.note].filter(Boolean).join(' · ')}
                </ThemedText>
              </View>
              <IconButton icon="delete" color={theme.danger} onPress={() => remove(l.productId)} accessibilityLabel="Remove" />
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => update(l.productId, clamp(l.quantity - 1))}>
                <Icon name="remove" size={20} />
              </Pressable>
              <TextInput
                value={String(l.quantity)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  update(l.productId, Number.isFinite(n) ? clamp(n) : min);
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                style={[styles.qty, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              />
              <Pressable
                style={[styles.stepBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => update(l.productId, clamp(l.quantity + 1))}>
                <Icon name="add" size={20} />
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary">
                {unit}
              </ThemedText>
            </View>
          </Card>
        );
      })}
      {onAdd ? <Button title={addLabel} icon="add" variant="secondary" onPress={onAdd} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  qty: {
    width: 76,
    height: 40,
    borderWidth: 1,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
