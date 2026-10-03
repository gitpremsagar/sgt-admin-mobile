import { useLocalSearchParams } from 'expo-router';

import { ReturnDetail } from '@/components/returns';

export default function SalesReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReturnDetail kind="return" id={id} />;
}
