import { useQuery, type QueryKey } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import {
  Button,
  confirmAction,
  Input,
  ListRow,
  MultiChips,
  SearchBar,
  SelectField,
  Sheet,
  SwitchRow,
  type IconName,
} from '@/components/ui';
import type { Option } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { toNumberOrNull } from '@/lib/format';

export type FormValues = Record<string, string | boolean | string[] | null>;

export type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'multiline' | 'number' | 'int' | 'email' | 'phone' | 'password' | 'select' | 'multi' | 'switch';
  options?: Option[];
  required?: boolean;
  /** Only required/shown when creating. */
  createOnly?: boolean;
  hint?: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  visible?: (values: FormValues) => boolean;
};

/** Converts form values into a JSON body using the field types. Empty optional values are omitted. */
export function valuesToBody(fields: FieldDef[], values: FormValues, editing: boolean) {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.visible && !f.visible(values)) continue;
    if (editing && f.createOnly) continue;
    const v = values[f.key];
    if (f.type === 'switch' || f.type === 'multi') {
      body[f.key] = v;
    } else if (f.type === 'number' || f.type === 'int') {
      const n = toNumberOrNull(String(v ?? ''));
      if (n !== null) body[f.key] = f.type === 'int' ? Math.round(n) : n;
    } else if (f.type === 'select') {
      if (v) body[f.key] = v;
      else if (editing) body[f.key] = null;
    } else {
      const s = String(v ?? '').trim();
      if (s) body[f.key] = s;
    }
  }
  return body;
}

export function validate(fields: FieldDef[], values: FormValues, editing: boolean) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.visible && !f.visible(values)) continue;
    if (editing && f.createOnly) continue;
    const v = values[f.key];
    if (f.required && (v === null || v === '' || (Array.isArray(v) && !v.length))) errors[f.key] = 'Required';
    if ((f.type === 'number' || f.type === 'int') && v && toNumberOrNull(String(v)) === null) errors[f.key] = 'Must be a number';
    if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(String(v))) errors[f.key] = 'Invalid email';
  }
  return errors;
}

export function FieldInput({
  field,
  values,
  setValue,
  error,
}: {
  field: FieldDef;
  values: FormValues;
  setValue: (key: string, v: FormValues[string]) => void;
  error?: string;
}) {
  const v = values[field.key];
  switch (field.type) {
    case 'switch':
      return <SwitchRow label={field.label} description={field.hint} value={!!v} onChange={(b) => setValue(field.key, b)} />;
    case 'select':
      return (
        <SelectField
          label={field.label}
          value={(v as string | null) ?? null}
          options={field.options ?? []}
          onChange={(x) => setValue(field.key, x)}
          allowClear={!field.required}
          searchable={(field.options?.length ?? 0) > 8}
          error={error}
        />
      );
    case 'multi':
      return (
        <MultiChips
          label={field.label}
          options={field.options ?? []}
          value={(v as string[]) ?? []}
          onChange={(x) => setValue(field.key, x)}
        />
      );
    default:
      return (
        <Input
          label={field.label}
          value={String(v ?? '')}
          onChangeText={(t) => setValue(field.key, t)}
          error={error}
          hint={field.hint}
          placeholder={field.placeholder}
          multiline={field.type === 'multiline'}
          secureTextEntry={field.type === 'password'}
          autoCapitalize={field.autoCapitalize ?? (field.type === 'email' || field.type === 'password' ? 'none' : 'sentences')}
          keyboardType={
            field.type === 'number'
              ? 'decimal-pad'
              : field.type === 'int'
                ? 'number-pad'
                : field.type === 'email'
                  ? 'email-address'
                  : field.type === 'phone'
                    ? 'phone-pad'
                    : 'default'
          }
        />
      );
  }
}

/** Renders a list of fields bound to local state plus a submit button. Remount (via key) to reset. */
export function FieldsForm({
  fields,
  initial,
  editing,
  submitLabel = 'Save',
  saving,
  onSubmit,
  footer,
}: {
  fields: FieldDef[];
  initial: FormValues;
  editing: boolean;
  submitLabel?: string;
  saving?: boolean;
  onSubmit: (body: Record<string, unknown>, values: FormValues) => void;
  footer?: ReactNode;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setValue = (key: string, v: FormValues[string]) => setValues((prev) => ({ ...prev, [key]: v }));

  return (
    <View style={{ gap: Spacing.three }}>
      {fields
        .filter((f) => (!f.visible || f.visible(values)) && !(editing && f.createOnly))
        .map((f) => (
          <FieldInput key={f.key} field={f} values={values} setValue={setValue} error={errors[f.key]} />
        ))}
      <Button
        title={submitLabel}
        loading={saving}
        onPress={() => {
          const e = validate(fields, values, editing);
          setErrors(e);
          if (!Object.keys(e).length) onSubmit(valuesToBody(fields, values, editing), values);
        }}
      />
      {footer}
    </View>
  );
}

export function initialValues<T>(fields: FieldDef[], item: T | null, toForm?: (item: T) => FormValues): FormValues {
  const base: FormValues = Object.fromEntries(
    fields.map((f) => [f.key, f.type === 'switch' ? false : f.type === 'multi' ? [] : f.type === 'select' ? null : ''])
  );
  if (!item) return base;
  if (toForm) return { ...base, ...toForm(item) };
  const rec = item as Record<string, unknown>;
  for (const f of fields) {
    const v = rec[f.key];
    if (v === undefined || v === null) continue;
    base[f.key] = f.type === 'switch' ? !!v : f.type === 'multi' ? (v as string[]) : String(v);
  }
  return base;
}

export type CrudConfig<T> = {
  title: string;
  singular: string;
  queryKey: QueryKey;
  list: () => Promise<T[]>;
  getId: (item: T) => string;
  itemTitle: (item: T) => string;
  itemSubtitle?: (item: T) => string | undefined;
  itemRight?: (item: T) => ReactNode;
  icon?: IconName;
  fields: FieldDef[];
  toForm?: (item: T) => FormValues;
  transformBody?: (body: Record<string, unknown>, values: FormValues, editing: boolean) => Record<string, unknown>;
  create?: (body: Record<string, unknown>) => Promise<unknown>;
  update?: (id: string, body: Record<string, unknown>) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  canDelete?: (item: T) => boolean;
  /** Override row press (e.g. navigate to a detail screen) instead of opening the edit sheet. */
  onItemPress?: (item: T) => void;
  /** Override the "new" FAB (e.g. navigate to a full-screen form). */
  onCreatePress?: () => void;
  sort?: (a: T, b: T) => number;
  searchText?: (item: T) => string;
  header?: ReactNode;
};

export function CrudScreen<T>(cfg: CrudConfig<T>) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const query = useQuery({ queryKey: cfg.queryKey, queryFn: cfg.list });
  const { sort, searchText, itemTitle } = cfg;
  const data = query.data;

  const rows = useMemo(() => {
    const list = [...(data ?? [])];
    if (sort) list.sort(sort);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => (searchText ?? itemTitle)(i).toLowerCase().includes(q));
  }, [data, search, sort, searchText, itemTitle]);

  return (
    <>
      <Stack.Screen options={{ title: cfg.title }} />
      <ListScreen
        data={rows}
        keyExtractor={cfg.getId}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle={`No ${cfg.title.toLowerCase()}`}
        emptyIcon={cfg.icon}
        fab={
          cfg.onCreatePress || cfg.create
            ? { onPress: cfg.onCreatePress ?? (() => setEditing('new')), label: `New ${cfg.singular.toLowerCase()}` }
            : undefined
        }
        header={
          <>
            {cfg.header}
            {(data?.length ?? 0) > 8 ? <SearchBar value={search} onChangeText={setSearch} placeholder={`Search ${cfg.title.toLowerCase()}`} /> : null}
          </>
        }
        renderItem={({ item }) => (
          <ListRow
            title={cfg.itemTitle(item)}
            subtitle={cfg.itemSubtitle?.(item)}
            right={cfg.itemRight?.(item)}
            onPress={() => (cfg.onItemPress ? cfg.onItemPress(item) : cfg.update ? setEditing(item) : undefined)}
          />
        )}
      />
      <Sheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `New ${cfg.singular.toLowerCase()}` : `Edit ${cfg.singular.toLowerCase()}`}>
        {editing ? <CrudForm cfg={cfg} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
      </Sheet>
    </>
  );
}

function CrudForm<T>({ cfg, item, onClose }: { cfg: CrudConfig<T>; item: T | null; onClose: () => void }) {
  const isEdit = !!item;
  const save = useApiMutation(
    (body: Record<string, unknown>) => (isEdit ? cfg.update!(cfg.getId(item!), body) : cfg.create!(body)),
    { invalidate: [cfg.queryKey], successMessage: `${cfg.singular} ${isEdit ? 'updated' : 'created'}`, onSuccess: onClose }
  );
  const remove = useApiMutation(() => cfg.remove!(cfg.getId(item!)), {
    invalidate: [cfg.queryKey],
    successMessage: `${cfg.singular} deleted`,
    onSuccess: onClose,
  });
  const canDelete = isEdit && cfg.remove && (!cfg.canDelete || cfg.canDelete(item!));

  return (
    <FieldsForm
      fields={cfg.fields}
      initial={initialValues(cfg.fields, item, cfg.toForm)}
      editing={isEdit}
      saving={save.isPending}
      onSubmit={(body, values) => save.mutate(cfg.transformBody ? cfg.transformBody(body, values, isEdit) : body)}
      footer={
        canDelete ? (
          <Button
            title={`Delete ${cfg.singular.toLowerCase()}`}
            variant="danger"
            icon="delete"
            loading={remove.isPending}
            onPress={async () => {
              if (
                await confirmAction({
                  title: `Delete ${cfg.itemTitle(item!)}?`,
                  message: 'This cannot be undone.',
                  confirmLabel: 'Delete',
                  destructive: true,
                })
              ) {
                remove.mutate();
              }
            }}
          />
        ) : null
      }
    />
  );
}
