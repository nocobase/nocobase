import { useTranslation } from '@nocobase/i18n/client';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  CalendarDaysIcon,
  KanbanIcon,
  TableIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { ExamplePage, ExampleSection } from '../shared';

const STATUS_FILTERS = [
  'statusPending',
  'statusProcessing',
  'statusShipped',
  'statusCompleted',
] as const;

export default function ToggleGroupExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState<string[]>([
    'statusPending',
    'statusProcessing',
  ]);

  return (
    <ExamplePage
      title={t('components.toggleGroup.title')}
      description={t('components.toggleGroup.description')}
      docs='https://ui.shadcn.com/docs/components/toggle-group'
    >
      <ExampleSection
        title={t('components.toggleGroup.single')}
        description={t('components.toggleGroup.singleDescription')}
      >
        <ToggleGroup variant='outline' defaultValue={['table']}>
          <ToggleGroupItem
            value='table'
            aria-label={t('components.toggleGroup.tableView')}
          >
            <TableIcon />
            {t('components.toggleGroup.tableView')}
          </ToggleGroupItem>
          <ToggleGroupItem
            value='board'
            aria-label={t('components.toggleGroup.boardView')}
          >
            <KanbanIcon />
            {t('components.toggleGroup.boardView')}
          </ToggleGroupItem>
          <ToggleGroupItem
            value='calendar'
            aria-label={t('components.toggleGroup.calendarView')}
          >
            <CalendarDaysIcon />
            {t('components.toggleGroup.calendarView')}
          </ToggleGroupItem>
        </ToggleGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggleGroup.multiple')}
        description={t('components.toggleGroup.multipleDescription')}
      >
        <ToggleGroup
          multiple
          variant='outline'
          value={statuses}
          onValueChange={(value: string[]) => setStatuses(value)}
        >
          {STATUS_FILTERS.map((status) => (
            <ToggleGroupItem key={status} value={status}>
              {t(`reference.${status}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className='text-sm text-muted-foreground'>
          {statuses.length === 0
            ? t('components.toggleGroup.noFilters')
            : t('components.toggleGroup.filterCount', {
                count: statuses.length,
              })}
        </span>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggleGroup.joined')}
        description={t('components.toggleGroup.joinedDescription')}
      >
        <ToggleGroup variant='outline' spacing={0} defaultValue={['left']}>
          <ToggleGroupItem
            value='left'
            aria-label={t('components.toggleGroup.alignLeft')}
          >
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            value='center'
            aria-label={t('components.toggleGroup.alignCenter')}
          >
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            value='right'
            aria-label={t('components.toggleGroup.alignRight')}
          >
            <AlignRightIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggleGroup.vertical')}
        description={t('components.toggleGroup.verticalDescription')}
      >
        <ToggleGroup
          multiple
          orientation='vertical'
          variant='outline'
          spacing={1}
          defaultValue={['email']}
        >
          <ToggleGroupItem value='email'>
            {t('components.toggleGroup.channelEmail')}
          </ToggleGroupItem>
          <ToggleGroupItem value='sms'>
            {t('components.toggleGroup.channelSms')}
          </ToggleGroupItem>
          <ToggleGroupItem value='webhook'>
            {t('components.toggleGroup.channelWebhook')}
          </ToggleGroupItem>
        </ToggleGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggleGroup.disabled')}
        description={t('components.toggleGroup.disabledDescription')}
      >
        <ToggleGroup variant='outline' defaultValue={['thisWeek']}>
          <ToggleGroupItem value='today'>
            {t('reference.today')}
          </ToggleGroupItem>
          <ToggleGroupItem value='thisWeek'>
            {t('reference.thisWeek')}
          </ToggleGroupItem>
          <ToggleGroupItem value='thisMonth'>
            {t('reference.thisMonth')}
          </ToggleGroupItem>
          <ToggleGroupItem value='thisYear' disabled>
            {t('reference.thisYear')}
          </ToggleGroupItem>
        </ToggleGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
