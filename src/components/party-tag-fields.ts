import type { FieldDef } from '@/components/crud';

export const partyTagFields = (officers: { id: string; name: string }[]): FieldDef[] => [
  { key: 'name', label: 'Name', required: true },
  { key: 'sortOrder', label: 'Sort order', type: 'int', hint: 'Defaults to 0' },
  { key: 'headerColor', label: 'Header colour', hint: 'Hex, e.g. #1E3A8A (defaults to green)', autoCapitalize: 'characters' },
  {
    key: 'salesOfficerId',
    label: 'Sales officer',
    type: 'select',
    options: officers.map((o) => ({ value: o.id, label: o.name })),
  },
];
