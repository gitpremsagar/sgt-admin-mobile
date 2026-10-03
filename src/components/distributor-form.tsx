import { router } from 'expo-router';

import { FieldsForm, initialValues, type FieldDef, type FormValues } from '@/components/crud';
import { Card } from '@/components/ui';
import { qk, usePartyTags } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { customersService, type CustomerBody } from '@/services/masters';
import type { Customer } from '@/types/models';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const dayKey = (d: (typeof DAYS)[number]) => `is${d}DispatchAllowed`;

export const CUSTOMER_VEHICLE_TYPES = ['LPT', 'LCV', 'PICKUP'].map((v) => ({ value: v, label: v }));

function fields(partyTags: { id: string; name: string }[]): FieldDef[] {
  return [
    { key: 'dbName', label: 'Distributor (firm) name', required: true, autoCapitalize: 'words' },
    {
      key: 'dbCategory',
      label: 'Category',
      type: 'select',
      required: true,
      options: ['DISTRIBUTOR', 'SS', 'RSS', 'WB', 'CHK', 'OTHER'].map((v) => ({ value: v, label: v })),
    },
    { key: 'name', label: 'Contact person', required: true, autoCapitalize: 'words' },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'password', label: 'Password', type: 'password', hint: 'Optional. Leave blank to keep the current password.' },
    {
      key: 'partyReportTagId',
      label: 'Party report tag',
      type: 'select',
      options: partyTags.map((t) => ({ value: t.id, label: t.name })),
    },
    { key: 'address', label: 'Address', type: 'multiline', required: true },
    { key: 'area', label: 'Area', required: true, autoCapitalize: 'words' },
    { key: 'state', label: 'State', required: true, autoCapitalize: 'words' },
    { key: 'pincode', label: 'Pincode', type: 'int' },
    { key: 'panNumber', label: 'PAN', autoCapitalize: 'characters' },
    { key: 'gstinNumber', label: 'GSTIN', autoCapitalize: 'characters' },
    { key: 'ownerAadharNumber', label: 'Owner Aadhaar', type: 'int' },
    { key: 'contact2', label: 'Alternate contact', type: 'phone' },
    { key: 'salesOfficerName', label: 'Sales officer name', autoCapitalize: 'words' },
    { key: 'salesOfficerContact', label: 'Sales officer contact', type: 'phone' },
    { key: 'vehicleType', label: 'Vehicle type', type: 'select', options: CUSTOMER_VEHICLE_TYPES },
    { key: 'twoSideDistance', label: 'Two-side distance (km)', type: 'int' },
    { key: 'creditLimit', label: 'Credit limit (₹)', type: 'int' },
    {
      key: 'paymentTerms',
      label: 'Payment terms',
      type: 'select',
      required: true,
      options: [
        { value: 'ADVANCE', label: 'Advance' },
        { value: 'ONE_BILL_CREDIT', label: 'One bill credit' },
      ],
    },
    { key: 'isCashDiscountAllowed', label: 'Cash discount allowed', type: 'switch' },
    {
      key: 'cashDiscountPercentage',
      label: 'Cash discount',
      type: 'select',
      options: [
        { value: 'POINT_5', label: '0.5%' },
        { value: 'POINT_75', label: '0.75%' },
      ],
      visible: (v) => !!v.isCashDiscountAllowed,
    },
    {
      key: 'dispatchDays',
      label: 'Dispatch days',
      type: 'multi',
      options: DAYS.map((d) => ({ value: d, label: d.slice(0, 3) })),
    },
  ];
}

function toForm(c: Customer): FormValues {
  const d = (c.CustomerDetail?.[0] ?? {}) as unknown as Record<string, unknown>;
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  return {
    name: c.name,
    email: c.email,
    phone: str(c.phone),
    dbName: str(d.dbName),
    dbCategory: (d.dbCategory as string) ?? null,
    partyReportTagId: (d.partyReportTagId as string) ?? null,
    address: str(d.address),
    area: str(d.area),
    state: str(d.state),
    pincode: str(d.pincode),
    panNumber: str(d.panNumber),
    gstinNumber: str(d.gstinNumber),
    ownerAadharNumber: str(d.ownerAadharNumber),
    contact2: str(d.contact2),
    salesOfficerName: str(d.salesOfficerName),
    salesOfficerContact: str(d.salesOfficerContact),
    vehicleType: (d.vehicleType as string) || null,
    twoSideDistance: str(d.twoSideDistance),
    creditLimit: str(d.creditLimit),
    paymentTerms: (d.paymentTerms as string) || 'ADVANCE',
    isCashDiscountAllowed: !!d.isCashDiscountAllowed,
    cashDiscountPercentage: (d.cashDiscountPercentage as string) ?? null,
    dispatchDays: DAYS.filter((day) => !!d[dayKey(day)]),
  };
}

function toBody(body: Record<string, unknown>, values: FormValues): CustomerBody {
  const { dispatchDays, ...rest } = body;
  const days = (dispatchDays as string[] | undefined) ?? [];
  const out: Record<string, unknown> = { ...rest };
  for (const d of DAYS) out[dayKey(d)] = days.includes(d);
  out.cashDiscountPercentage = values.isCashDiscountAllowed ? (body.cashDiscountPercentage ?? null) : null;
  out.partyReportTagId = body.partyReportTagId ?? null;
  if (body.pincode !== undefined) out.pincode = String(body.pincode);
  return out as CustomerBody;
}

export function DistributorForm({ customer }: { customer?: Customer }) {
  const partyTags = usePartyTags();
  const defs = fields(partyTags.data ?? []);
  const editing = !!customer;
  const initial = customer
    ? initialValues(defs, customer, toForm)
    : { ...initialValues(defs, null), paymentTerms: 'ADVANCE', vehicleType: 'LCV' };

  const save = useApiMutation(
    (body: CustomerBody) => (customer ? customersService.update(customer.id, body) : customersService.create(body)),
    {
      invalidate: [qk.customers, qk.partyTags],
      successMessage: editing ? 'Distributor updated' : 'Distributor created',
      onSuccess: () => {
        if (!editing) router.back();
      },
    }
  );

  return (
    <Card>
      <FieldsForm
        fields={defs}
        initial={initial}
        editing={editing}
        submitLabel={editing ? 'Save changes' : 'Create distributor'}
        saving={save.isPending}
        onSubmit={(body, values) => save.mutate(toBody(body, values))}
      />
    </Card>
  );
}
