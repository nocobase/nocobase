import { useTranslation } from '@nocobase/i18n/client';
import { ListFeedback } from '#components/list-feedback';
import { SettingsModulePage } from '../settings-module-page.js';

export default function WorkflowExecutionsPage() {
  const { t } = useTranslation();
  return (
    <SettingsModulePage>
      <ListFeedback
        state='empty'
        empty={t('settings.workflows.emptyExecutions')}
      />
    </SettingsModulePage>
  );
}
