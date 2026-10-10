/** Search, filters and the view switch above Studio's issues. */
import { useTranslation } from '@nocobase/i18n/client';
import { ListFilterIcon, SearchIcon, XIcon } from 'lucide-react';
import { useRef, useState, type ComponentType, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    <div className='flex min-w-0 flex-col gap-1'>
      <span className='text-xs font-medium text-muted-foreground'>
        {filter.label}
      </span>
      <Select
        items={items}
        value={selected}
        onValueChange={(next) =>
          onChange(next && next !== 'all' ? next : undefined)
        }
      >
        <SelectTrigger className='w-full' aria-label={filter.label}>
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
    </div>
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const {
    toolbarFilters,
    searchText,
    setSearchText,
    scheduleSearch,
    searchRef,
  } = page;
  const selectedFilters = toolbarFilters.filter(
    (filter) => filter.value !== undefined,
  );
  const filterCount = selectedFilters.length;
  const summary = [
    ...selectedFilters.map((filter) => {
      const value = filter.options.find(
        (option) => option.value === filter.value,
      )?.label;
      return `${filter.label}: ${value ?? filter.value}`;
    }),
    ...(searchText.trim()
      ? [`${t('issuesPage.searchLabel')}: ${searchText.trim()}`]
      : []),
  ].join(' · ');

  const searchField = (ref: typeof searchRef) => (
    <InputGroup className='w-full'>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        value={searchText}
        placeholder={t('issuesPage.searchPlaceholder')}
        aria-label={t('issuesPage.searchLabel')}
        onChange={(event) => {
          setSearchText(event.target.value);
          if (!(event.nativeEvent as InputEvent).isComposing)
            scheduleSearch(event.target.value);
        }}
        onCompositionEnd={(event) => scheduleSearch(event.currentTarget.value)}
      />
    </InputGroup>
  );

  const clearFilters = () => {
    page.clearFilters();
    if (!window.matchMedia('(min-width: 768px)').matches) {
      setFiltersOpen(true);
      window.requestAnimationFrame(() => mobileSearchRef.current?.focus());
    }
  };

  return (
    <div
      className='flex min-w-0 flex-wrap items-center gap-2 md:flex-nowrap'
      data-testid='issues-toolbar'
    >
      <div className='hidden min-w-24 max-w-64 flex-[1_1_12rem] md:block'>
        {searchField(searchRef)}
      </div>
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger
          render={
            <Button
              variant='outline'
              size='sm'
              className='shrink-0'
              aria-label={`${t('issuesPage.filtersToggle')}${searchText.trim() ? `, ${t('issuesPage.searchActive')}` : ''}${filterCount ? `, ${filterCount}` : ''}`}
            />
          }
        >
          <ListFilterIcon data-icon='inline-start' />
          <span>{t('issuesPage.filtersToggle')}</span>
          {filterCount > 0 ? (
            <span className='text-muted-foreground tabular-nums'>
              {filterCount}
            </span>
          ) : null}
          {searchText.trim() ? (
            <SearchIcon className='size-3 text-primary md:hidden' />
          ) : null}
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className='max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-1rem))] overflow-y-auto md:w-96'
        >
          <PopoverTitle className='px-1'>
            {t('issuesPage.filtersToggle')}
          </PopoverTitle>
          <div className='md:hidden'>{searchField(mobileSearchRef)}</div>
          <div className='flex flex-col gap-2'>
            {toolbarFilters.map((filter) => (
              <FilterSelect
                key={filter.key}
                filter={filter}
                onChange={(value) => page.setFilter(filter.key, value)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {summary ? (
        <span
          className='hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block'
          title={summary}
          aria-label={summary}
        >
          {summary}
        </span>
      ) : null}
      {page.filtered || searchText.trim() !== '' ? (
        <Button
          variant='ghost'
          size='sm'
          className='shrink-0 px-2 sm:px-3'
          aria-label={t('issuesPage.clearFilters')}
          onClick={clearFilters}
        >
          <XIcon data-icon='inline-start' />
          <span className='hidden sm:inline'>
            {t('issuesPage.clearFilters')}
          </span>
        </Button>
      ) : null}
      {fetching ? (
        <Spinner
          className='size-4 shrink-0 text-muted-foreground'
          aria-label={t('issuesPage.loading')}
        />
      ) : null}
      <ToggleGroup
        variant='outline'
        size='sm'
        spacing={0}
        className='ml-auto shrink-0'
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
