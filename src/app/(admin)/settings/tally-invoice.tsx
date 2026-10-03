import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, Row, Screen, Section, StatCard } from '@/components/ui';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { tallyInvoiceService, type TallyInvoiceSettings } from '@/services/masters';

const KEY = ['tally-invoice-settings'];

export default function TallyInvoiceScreen() {
  const query = useQuery({ queryKey: KEY, queryFn: tallyInvoiceService.get });
  return (
    <>
      <Stack.Screen options={{ title: 'Tally invoice' }} />
      <QueryBoundary query={query}>
        {(s) => (
          <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
            <Row>
              <StatCard label="Financial year" value={s.financialYear} />
              <StatCard label="Next invoice" value={s.nextInvoiceIdPreview} tone="info" />
            </Row>
            <NextNumberForm key={`${s.financialYear}-${s.nextNumber}`} settings={s} />
          </Screen>
        )}
      </QueryBoundary>
    </>
  );
}

function NextNumberForm({ settings }: { settings: TallyInvoiceSettings }) {
  const [value, setValue] = useState(String(settings.nextNumber));
  const n = Number(value);
  const valid = Number.isInteger(n) && n >= 1;
  const save = useApiMutation(() => tallyInvoiceService.update({ nextNumber: n, financialYear: settings.financialYear }), {
    invalidate: [KEY],
    successMessage: 'Next invoice number updated',
  });

  return (
    <Section title="Numbering">
      <Card>
        <Input
          label="Next invoice number"
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          error={value && !valid ? 'Must be a whole number of 1 or more' : undefined}
        />
        <ThemedText type="small" themeColor="textSecondary">
          The next invoice created for {settings.financialYear} will use this number. Times are in {settings.timeZone}.
        </ThemedText>
        <Button
          title="Save"
          disabled={!valid || n === settings.nextNumber}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </Card>
    </Section>
  );
}
