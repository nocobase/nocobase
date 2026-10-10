import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ExamplePage, ExampleSection } from '../shared';

const tableRows = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];
const listRows = ['item-1', 'item-2', 'item-3', 'item-4'];

export default function SkeletonExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  return (
    <ExamplePage
      title={t('components.skeleton.title')}
      description={t('components.skeleton.description')}
      docs='https://ui.shadcn.com/docs/components/skeleton'
    >
      <ExampleSection
        title={t('components.skeleton.card')}
        description={t('components.skeleton.cardDescription')}
        contentClassName='items-start'
      >
        <Card className='w-full max-w-xs'>
          <CardHeader>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-4 w-1/2' />
          </CardHeader>
          <CardContent>
            <Skeleton className='aspect-video w-full' />
          </CardContent>
          <CardFooter className='gap-2'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-16' />
          </CardFooter>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.skeleton.tableRows')}
        description={t('components.skeleton.tableRowsDescription')}
        contentClassName='block'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reference.customer')}</TableHead>
              <TableHead>{t('reference.status')}</TableHead>
              <TableHead>{t('reference.date')}</TableHead>
              <TableHead className='text-right'>
                {t('reference.amount')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='size-6 rounded-full' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-16 rounded-full' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell>
                  <Skeleton className='ml-auto h-4 w-16' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ExampleSection>

      <ExampleSection
        title={t('components.skeleton.list')}
        description={t('components.skeleton.listDescription')}
        contentClassName='block'
      >
        <div className='w-full max-w-md divide-y'>
          {listRows.map((row) => (
            <div key={row} className='flex items-center gap-3 py-3'>
              <Skeleton className='size-8 shrink-0 rounded-full' />
              <div className='grid flex-1 gap-1.5'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-8 w-16' />
            </div>
          ))}
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.skeleton.form')}
        description={t('components.skeleton.formDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-xs flex-col gap-6'>
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-8 w-full' />
          </div>
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-8 w-full' />
          </div>
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-16 w-full' />
          </div>
          <Skeleton className='h-8 w-24' />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.skeleton.matchContent')}
        description={t('components.skeleton.matchContentDescription')}
        contentClassName='block'
      >
        <div className='flex w-full flex-col gap-4'>
          <Button
            variant='outline'
            size='sm'
            className='w-fit'
            onClick={() => setLoading((value) => !value)}
          >
            {loading
              ? t('components.skeleton.showContent')
              : t('components.skeleton.showSkeleton')}
          </Button>
          <Card className='w-full max-w-sm'>
            <CardContent className='flex items-center gap-4'>
              {loading ? (
                <>
                  <Skeleton className='size-10 shrink-0 rounded-full' />
                  <div className='grid flex-1 gap-2'>
                    <Skeleton className='h-4 w-2/3' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                  <Skeleton className='h-5 w-14 rounded-full' />
                </>
              ) : (
                <>
                  <Avatar size='lg'>
                    <AvatarFallback>OC</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 gap-1'>
                    <span className='text-sm font-medium'>Olivia Chen</span>
                    <span className='text-xs text-muted-foreground'>
                      olivia.chen@northwind.example
                    </span>
                  </div>
                  <Badge>{t('reference.statusActive')}</Badge>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
