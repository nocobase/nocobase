import type { ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { Section } from '../components/flow-ui.js';
import { NAMESPACE, names } from '../lib/format.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { api, type Config } from '../lib/api.js';
import { useLoader } from '../lib/use-loader.js';

function Table({
  headers,
  rows,
}: {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}): ReactElement {
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>
          <tr>
            {headers.map((header) => (
              <th key={header} className='px-3 py-2 font-medium'>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')} className='border-t'>
              {row.map((cell, index) => (
                <td key={headers[index]} className='px-3 py-2'>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The configuration the processes read: departments, management groups, holidays. */
export default function ConfigurationPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const { data } = useLoader(() => client.get<Config>('config'), 'config');
  return (
    <PageContainer>
      <PageHeader
        title={t('configuration.title')}
        description={t('configuration.description')}
      />
      <Section title='部门配置'>
        <Table
          headers={['分发部门', '办事人员', '部门主管及其他', '分管领导']}
          rows={(data?.departments ?? []).map((item) => [
            item.name,
            names(item.clerks),
            names(item.heads),
            names(item.leaders),
          ])}
        />
      </Section>
      <Section title='公司管理层群组'>
        <Table
          headers={['群组', '抄送人员']}
          rows={(data?.managementGroups ?? []).map((item) => [
            item.name,
            names(item.members),
          ])}
        />
      </Section>
      <Section title='工作日历（法定节假日与调休上班）'>
        <Table
          headers={['日期', '类型', '说明']}
          rows={[...(data?.holidays ?? [])]
            .sort((left, right) => left.date.localeCompare(right.date))
            .map((item) => [
              item.date,
              item.kind === 'workday' ? '调休上班' : '放假',
              item.name,
            ])}
        />
      </Section>
    </PageContainer>
  );
}
