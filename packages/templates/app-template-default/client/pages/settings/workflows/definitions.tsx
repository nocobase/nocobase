import { useTranslation } from '@nocobase/i18n/client';
import { ListFeedback } from '#components/list-feedback';
import { SettingsModulePage } from '../settings-module-page.js';

export default function WorkflowDefinitionsPage() {
  const { t, i18n } = useTranslation();
  return (
    <SettingsModulePage>
      <ListFeedback
        state='empty'
        empty={
          <>
            <span className='whitespace-normal'>
              {t('settings.workflows.managementHint')}
            </span>{' '}
            <a
              href={`https://docs.nocobase.com${i18n.language.startsWith('zh') ? '/zh-CN' : ''}/core/developing-apps/business-workflows/`}
              target='_blank'
              rel='noreferrer'
              className='whitespace-nowrap'
            >
              {t('settings.workflows.documentation')}
            </a>
          </>
        }
      />
    </SettingsModulePage>
  );
}
