import { useTranslation } from '@nocobase/i18n/client';
import AgentPreferences from '#components/online-agent/preferences';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Card, CardContent } from '#components/ui/card';
import { FieldGroup } from '#components/ui/field';

export default function AgentPreferencesPage() {
  const { t } = useTranslation();
  return (
    <PageContainer className='max-w-[860px]'>
      <PageHeader title={t('onlineAgent.personal')} />
      <Card>
        <CardContent>
          <FieldGroup>
            <AgentPreferences />
          </FieldGroup>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
