import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import { useState, type ReactElement } from 'react';
import { Info, CircleAlert, Inbox } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '#components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '#components/ui/table';
import { Avatar, AvatarFallback } from '#components/ui/avatar';
import { Progress } from '#components/ui/progress';
import { ScrollArea } from '#components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { Loading } from '#components/loading';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { Separator } from '#components/ui/separator';
import { Kbd, KbdGroup } from '#components/ui/kbd';
import { StatusBadge } from '#components/status-badge';
import { GalleryPage, GallerySection } from './gallery-shared';
const people = [
  { name: 'Alex Chen', initials: 'AC', progress: 75 },
  { name: 'Emma Lee', initials: 'EL', progress: 40 },
  { name: 'Ryan Wu', initials: 'RW', progress: 100 },
];
export default function FeedbackGallery(): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [show, setShow] = useState(false);
  return (
    <GalleryPage view='feedback'>
      <GallerySection
        title='records'
        components='Card, Table, Avatar, Progress'
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('gallery.overview')}</CardTitle>
            <CardDescription>{t('gallery.overviewText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarFallback>NB</AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>NocoBase</p>
                <p className='text-sm text-muted-foreground'>
                  {t('gallery.product')}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <StatusBadge tone='info'>{t('gallery.alertTitle')}</StatusBadge>
          </CardFooter>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('gallery.person')}</TableHead>
              <TableHead>{t('gallery.role')}</TableHead>
              <TableHead>{t('gallery.progress')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person, i) => (
              <TableRow key={person.name}>
                <TableCell>
                  <div className='flex items-center gap-2 whitespace-nowrap'>
                    <Avatar size='sm'>
                      <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                    {person.name}
                  </div>
                </TableCell>
                <TableCell>
                  {t(`gallery.${['product', 'design', 'engineering'][i]}`)}
                </TableCell>
                <TableCell>
                  <div className='min-w-24 flex flex-col gap-2'>
                    <Progress
                      value={person.progress}
                      aria-label={`${person.name} ${t('gallery.progress')}`}
                    />
                    <span className='text-xs text-muted-foreground'>
                      {person.progress}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GallerySection>
      <GallerySection title='messages' components='Alert, Toast, Empty'>
        <Alert data-tone='info'>
          <Info />
          <AlertTitle>{t('gallery.alertTitle')}</AlertTitle>
          <AlertDescription>{t('gallery.alertText')}</AlertDescription>
        </Alert>
        <Alert variant='destructive'>
          <CircleAlert />
          <AlertTitle>{t('gallery.errorTitle')}</AlertTitle>
          <AlertDescription>{t('gallery.errorText')}</AlertDescription>
        </Alert>
        <div className='flex flex-wrap gap-3'>
          <Button
            onClick={() =>
              toaster.show({
                type: 'success',
                title: t('gallery.toastSuccess'),
              })
            }
          >
            {t('gallery.success')}
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              toaster.show({ type: 'error', title: t('gallery.toastError') })
            }
          >
            {t('gallery.error')}
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              toaster.show({
                type: 'error',
                title: t('gallery.errorTitle'),
                description: t('gallery.errorText'),
                // Dismiss manually so the preview can be inspected at any pace.
                duration: 0,
              })
            }
          >
            {t('gallery.detailedMessage')}
          </Button>
        </div>
        {show ? (
          <div
            role='status'
            aria-label={t('gallery.records')}
            className='flex flex-col gap-4 rounded-lg border p-4'
          >
            <p className='text-sm'>{people.map((p) => p.name).join(' · ')}</p>
            <Button variant='outline' onClick={() => setShow(false)}>
              {t('gallery.reset')}
            </Button>
          </div>
        ) : (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>{t('gallery.empty')}</EmptyTitle>
              <EmptyDescription>{t('gallery.emptyText')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant='outline' onClick={() => setShow(true)}>
                {t('gallery.showData')}
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </GallerySection>
      <GallerySection
        title='loading'
        components='Skeleton, BrandSpinner, BrandLoading, Progress'
      >
        <div className='flex items-center gap-3'>
          <Skeleton className='size-12 rounded-full' />
          <div className='flex-1 flex flex-col gap-2'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-3 w-full' />
          </div>
        </div>
        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
          <Spinner />
          {t('gallery.loading')}
        </div>
        <div className='flex min-h-32 items-center justify-center rounded-lg border bg-muted/30'>
          <Loading label={t('gallery.loading')} />
        </div>
        <Progress value={35} aria-label={t('gallery.progress')} />
      </GallerySection>
      <GallerySection title='scroll' components='ScrollArea, Separator, Kbd'>
        <ScrollArea className='h-48 rounded-lg border'>
          <div className='p-4'>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i}>
                <p className='py-3 text-sm'>
                  {String(i + 1).padStart(2, '0')} · {t('gallery.updated')}
                </p>
                {i < 11 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
        <h3 className='text-base font-medium'>{t('gallery.typography')}</h3>
        <p className='text-sm text-muted-foreground'>{t('gallery.text')}</p>
        <p className='font-serif'>{t('gallery.text')}</p>
        <code className='text-sm'>theme = "NocoBase"</code>
        <Separator />
        <p className='flex items-center gap-2 text-sm'>
          {t('gallery.shortcutExample')}
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
        </p>
      </GallerySection>
    </GalleryPage>
  );
}
