import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { CrudScreen } from '@/components/crud';
import { partyTagFields } from '@/components/party-tag-fields';
import { Badge } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { partyReportTagsService, salesOfficersService, type PartyReportTag } from '@/services/masters';

export default function PartyTagsScreen() {
  const officers = useQuery({ queryKey: ['sales-officers'], queryFn: salesOfficersService.list });
  return (
    <CrudScreen<PartyReportTag>
      title="Party report tags"
      singular="Tag"
      icon="local_offer"
      queryKey={qk.partyTags}
      list={() => partyReportTagsService.list()}
      getId={(t) => t.id}
      itemTitle={(t) => t.name}
      itemSubtitle={(t) => t.SalesOfficer?.name}
      itemRight={(t) => <Badge label={`${t._count?.CustomerDetails ?? 0} parties`} />}
      sort={(a, b) => a.sortOrder - b.sortOrder}
      fields={partyTagFields(officers.data ?? [])}
      create={partyReportTagsService.create}
      onItemPress={(t) => router.push({ pathname: '/settings/party-tags/[id]', params: { id: t.id } })}
    />
  );
}
