/**
 * Search, filters and the view switch above Studio's issues. Everything writes to the query string through the page
 * (`use-issues-page.ts`); the search box keeps its own text (`useUrlSearch`). Below `md` the search and the filters
 * fold behind a "Filters" button with the active count, so the view below gets the height.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ListFilterIcon, SearchIcon, XIcon } from 'lucide-react';
import { useId, useState, type ComponentType, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from 'cn';

import type { IssueToolbarFilter, IssuesPage } from './use-issues-page.js';

/** One option of the view switch. */
export interface IssueViewOption {
  readonly key: string;
  readonly label: string;
  readonly icon: ComponentType<{ readonly className?: string }>;
}

function FilterSelect({
  filter,
  onChange,
}: {
  readonly filter: IssueToolbarFilter;
  readonly onChange: (value: string | undefined) => void;
}): ReactElement {
  const items = [{ value: 'all', label: filter.allLabel }, ...filter.options];
  const selected =
    filter.value &&
    filter.options.some((option) => option.value === filter.value)
      ? filter.value
      : 'all';
  return (
    <Select
      items={items}
      value={selected}
      onValueChange={(next) =>
        onChange(next && next !== 'all' ? next : undefined)
      }
    >
      <SelectTrigger className='w-full md:w-40' aria-label={filter.label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function IssueToolbar({
  page,
  views,
  fetching,
}: {
  readonly page: IssuesPage;
  readonly views: readonly IssueViewOption[];
  readonly fetching: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const fieldsId = useId();
  const {
    toolbarFilters,
    searchText,
    setSearchText,
    scheduleSearch,
    searchRef,
  } = page;
  const active =
    toolbarFilters.filter((filter) => filter.value !== undefined).length +
    (searchText.trim() === '' ? 0 : 1);
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        className='md:hidden'
        aria-expanded={expanded}
        aria-controls={fieldsId}
        onClick={() => setExpanded((open) => !open)}
      >
        <ListFilterIcon data-icon='inline-start' />
        {t('issuesPage.filtersToggle')}
        {active > 0 ? (
          <span className='text-muted-foreground tabular-nums'>{active}</span>
        ) : null}
      </Button>
      {/* Below md: a two-column block on its own line, shown only when expanded; from md: part of the row. */}
      <div
        id={fieldsId}
        className={cn(
          'order-last w-full grid-cols-2 gap-2 md:contents',
          expanded ? 'grid' : 'hidden',
        )}
      >
        <InputGroup className='col-span-2 w-full md:w-64'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            value={searchText}
            placeholder={t('issuesPage.searchPlaceholder')}
            aria-label={t('issuesPage.searchLabel')}
            onChange={(event) => {
              setSearchText(event.target.value);
              if (!(event.nativeEvent as InputEvent).isComposing)
                scheduleSearch(event.target.value);
            }}
            onCompositionEnd={(event) =>
              scheduleSearch(event.currentTarget.value)
            }
          />
        </InputGroup>
        {toolbarFilters.map((filter) => (
          <FilterSelect
            key={filter.key}
            filter={filter}
            onChange={(value) => page.setFilter(filter.key, value)}
          />
        ))}
      </div>
      {page.filtered || searchText.trim() !== '' ? (
        <Button variant='ghost' size='sm' onClick={page.clearFilters}>
          <XIcon data-icon='inline-start' />
          {t('issuesPage.clearFilters')}
        </Button>
      ) : null}
      {fetching ? (
        <Spinner
          className='size-4 text-muted-foreground'
          aria-label={t('issuesPage.loading')}
        />
      ) : null}
      <ToggleGroup
        variant='outline'
        size='sm'
        spacing={0}
        className='ml-auto'
        value={[page.view]}
        onValueChange={(values: string[]) => {
          const [next] = values;
          if (next && views.some((view) => view.key === next))
            page.setView(next);
        }}
        aria-label={t('issuesPage.views.label')}
      >
        {views.map((view) => (
          <ToggleGroupItem
            key={view.key}
            value={view.key}
            aria-label={view.label}
            title={view.label}
          >
            <view.icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
