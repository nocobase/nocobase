import { useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useI18nRuntime,
  useLocale,
  useTranslation,
} from '@nocobase/i18n/client';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Skeleton } from '#components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';

import { createFallbackDemo, formatRegion, formatSample } from './demo';

const regions = ['zh-CN', 'en-US', 'de-DE'].map(formatRegion);

export default function I18nExamplesPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const runtime = useI18nRuntime();
  const defaultLocale = runtime.getDefaultLocale();
  const [countInput, setCountInput] = useState('1');
  const count = Number(countInput);
  const validCount =
    countInput.trim() !== '' && Number.isSafeInteger(count) && count >= 0;
  const fallback = useQuery({
    queryKey: ['i18n-examples', locale, defaultLocale],
    queryFn: () =>
      createFallbackDemo(locale, defaultLocale, t('i18nExamples.defaultValue')),
    staleTime: Infinity,
    retry: false,
  });

  function retryFallback(): void {
    const request = fallback.refetch();
    request.catch(() => {
      // The query's error state renders the failure and keeps retry available.
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('i18nExamples.title')}
        description={t('i18nExamples.description')}
      />
      <div className='grid items-start gap-6 xl:grid-cols-2'>
        <Card role='region' aria-labelledby='plural-title'>
          <CardHeader>
            <CardTitle>
              <h2 id='plural-title'>{t('i18nExamples.pluralTitle')}</h2>
            </CardTitle>
            <CardDescription>
              {t('i18nExamples.pluralDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-5'>
            <Badge variant='secondary'>{locale}</Badge>
            <FieldGroup>
              <Field data-invalid={!validCount}>
                <FieldLabel htmlFor='plural-count'>
                  {t('i18nExamples.count')}
                </FieldLabel>
                <Input
                  id='plural-count'
                  type='number'
                  min={0}
                  step={1}
                  value={countInput}
                  aria-invalid={!validCount}
                  aria-describedby='count-hint'
                  onChange={(event) => setCountInput(event.target.value)}
                />
                <FieldDescription id='count-hint'>
                  {t('i18nExamples.countHint')}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <ToggleGroup
              variant='outline'
              value={validCount ? [String(count)] : []}
              aria-label={t('i18nExamples.presets')}
              onValueChange={(values: string[]) => {
                if (values[0] !== undefined) setCountInput(values[0]);
              }}
            >
              {[0, 1, 2, 5].map((value) => (
                <ToggleGroupItem key={value} value={String(value)}>
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p role='status' className='font-heading text-2xl font-semibold'>
              {validCount
                ? t('i18nExamples.itemCount', { count })
                : t('i18nExamples.invalidCount')}
            </p>
            <pre
              tabIndex={0}
              className='overflow-x-auto rounded-lg bg-muted p-4 text-xs'
            >
              <code>{`t('i18nExamples.itemCount', { count })\n\nen-US:\n  itemCount_one: '{{count}} item'\n  itemCount_other: '{{count}} items'\n\nzh-CN:\n  itemCount_one: '{{count}} 个项目'\n  itemCount_other: '{{count}} 个项目'`}</code>
            </pre>
          </CardContent>
        </Card>

        <Card role='region' aria-labelledby='fallback-title'>
          <CardHeader>
            <CardTitle>
              <h2 id='fallback-title'>{t('i18nExamples.fallbackTitle')}</h2>
            </CardTitle>
            <CardDescription>
              {t('i18nExamples.fallbackDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <p className='text-sm text-muted-foreground'>
              {t('i18nExamples.fallbackChain', { locale, defaultLocale })}
            </p>
            {fallback.isPending ? (
              <Skeleton
                className='h-48 w-full'
                aria-label={t('i18nExamples.loading')}
              />
            ) : null}
            {fallback.isError ? (
              <div className='flex flex-col gap-2'>
                <p role='alert'>{t('i18nExamples.error')}</p>
                <Button variant='outline' onClick={retryFallback}>
                  {t('i18nExamples.retry')}
                </Button>
              </div>
            ) : null}
            {fallback.data ? (
              <Table tabIndex={0} aria-labelledby='fallback-title'>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('i18nExamples.scenario')}</TableHead>
                    <TableHead>{t('i18nExamples.result')}</TableHead>
                    <TableHead>{t('i18nExamples.source')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fallback.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className='whitespace-normal'>
                        <p>{t(`i18nExamples.scenarios.${row.id}`)}</p>
                        <code className='text-xs text-muted-foreground'>
                          {row.key}
                        </code>
                      </TableCell>
                      <TableCell className='whitespace-normal'>
                        {row.text}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {row.source === 'key'
                            ? t('i18nExamples.keySource')
                            : row.source}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
            <p className='text-sm text-muted-foreground'>
              {t('i18nExamples.isolationNote')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card role='region' aria-labelledby='format-title'>
        <CardHeader>
          <CardTitle>
            <h2 id='format-title'>{t('i18nExamples.formatTitle')}</h2>
          </CardTitle>
          <CardDescription>
            {t('i18nExamples.formatDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <code className='break-all text-xs text-muted-foreground'>
            {formatSample.value} · {formatSample.currency} · {formatSample.date}{' '}
            · {formatSample.timeZone}
          </code>
          <Table tabIndex={0} aria-labelledby='format-title'>
            <TableHeader>
              <TableRow>
                <TableHead>{t('i18nExamples.region')}</TableHead>
                <TableHead>{t('i18nExamples.number')}</TableHead>
                <TableHead>{t('i18nExamples.currency')}</TableHead>
                <TableHead>{t('i18nExamples.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((row) => (
                <TableRow key={row.locale}>
                  <TableCell>
                    <Badge variant='secondary'>{row.locale}</Badge>
                  </TableCell>
                  <TableCell className='tabular-nums'>{row.number}</TableCell>
                  <TableCell className='tabular-nums'>{row.currency}</TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className='text-sm text-muted-foreground'>
            {t('i18nExamples.formatNote')}
          </p>
          <pre
            tabIndex={0}
            className='overflow-x-auto rounded-lg bg-muted p-4 text-xs'
          >
            <code>{`new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234567.89)\nnew Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date)`}</code>
          </pre>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
