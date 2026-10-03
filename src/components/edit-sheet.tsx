import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Sheet } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { toNumberOrNull } from '@/lib/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  label: string;
  initial: string | number | null | undefined;
  kind?: 'text' | 'number' | 'multiline';
  hint?: string;
  allowEmpty?: boolean;
  saving?: boolean;
  onSave: (value: string | number | null) => void;
};

/** Single-field edit sheet used for quick PATCH actions. */
export function EditSheet(props: Props) {
  return (
    <Sheet visible={props.visible} onClose={props.onClose} title={props.title}>
      {props.visible ? <EditBody {...props} /> : null}
    </Sheet>
  );
}

function EditBody({ label, initial, kind = 'text', hint, allowEmpty = true, saving, onSave }: Props) {
  const [value, setValue] = useState(initial == null ? '' : String(initial));
  const parsed = kind === 'number' ? toNumberOrNull(value) : value.trim() ? value.trim() : null;
  const invalid = (kind === 'number' && value.trim() !== '' && parsed === null) || (!allowEmpty && parsed === null);

  return (
    <View style={{ gap: Spacing.three }}>
      <Input
        label={label}
        value={value}
        onChangeText={setValue}
        keyboardType={kind === 'number' ? 'decimal-pad' : 'default'}
        multiline={kind === 'multiline'}
        autoFocus
        hint={hint}
        error={invalid ? 'Enter a valid value' : undefined}
      />
      <Button title="Save" onPress={() => onSave(parsed)} loading={saving} disabled={invalid} />
    </View>
  );
}
