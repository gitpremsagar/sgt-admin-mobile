import { useLocalSearchParams } from 'expo-router';

import { ReturnDetail } from '@/components/returns';

export default function CreditNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReturnDetail kind="credit" id={id} />;
}
