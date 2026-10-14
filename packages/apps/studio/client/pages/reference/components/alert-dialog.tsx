import { useTranslation } from '@nocobase/i18n/client';
import { Share2Icon, Trash2Icon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

export default function AlertDialogExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const handleDelete = (): void => {
    setDeleting(true);
    // Stands in for the request a real page would await before closing.
    window.setTimeout(() => {
      setDeleting(false);
      setDeleteOpen(false);
    }, 1200);
  };

  return (
    <ExamplePage
      title={t('components.alertDialog.title')}
      description={t('components.alertDialog.description')}
      docs='https://ui.shadcn.com/docs/components/alert-dialog'
    >
      <ExampleSection
        title={t('components.alertDialog.basic')}
        description={t('components.alertDialog.basicDescription')}
      >
        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogTrigger render={<Button variant='outline' />}>
            {t('components.alertDialog.archiveProject')}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('components.alertDialog.archiveTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('components.alertDialog.archiveDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('reference.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => setArchiveOpen(false)}>
                {t('components.alertDialog.archive')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.alertDialog.small')}
        description={t('components.alertDialog.smallDescription')}
      >
        <AlertDialog open={sendOpen} onOpenChange={setSendOpen}>
          <AlertDialogTrigger render={<Button variant='outline' />}>
            {t('components.alertDialog.sendInvoice')}
          </AlertDialogTrigger>
          <AlertDialogContent size='sm'>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('components.alertDialog.sendTitle', {
                  invoice: 'INV-2031',
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('components.alertDialog.sendDescription', {
                  email: 'billing@acme.com',
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('components.alertDialog.notNow')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => setSendOpen(false)}>
                {t('components.alertDialog.send')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.alertDialog.withMedia')}
        description={t('components.alertDialog.withMediaDescription')}
      >
        <AlertDialog open={shareOpen} onOpenChange={setShareOpen}>
          <AlertDialogTrigger render={<Button variant='outline' />}>
            <Share2Icon data-icon='inline-start' />
            {t('reference.share')}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Share2Icon />
              </AlertDialogMedia>
              <AlertDialogTitle>
                {t('components.alertDialog.shareTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('components.alertDialog.shareDescription', {
                  team: 'Finance',
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('reference.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => setShareOpen(false)}>
                {t('reference.share')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.alertDialog.destructive')}
        description={t('components.alertDialog.destructiveDescription')}
      >
        <AlertDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            if (!deleting) setDeleteOpen(open);
          }}
        >
          <AlertDialogTrigger render={<Button variant='destructive' />}>
            <Trash2Icon data-icon='inline-start' />
            {t('components.alertDialog.deleteCustomer')}
          </AlertDialogTrigger>
          <AlertDialogContent size='sm'>
            <AlertDialogHeader>
              <AlertDialogMedia className='bg-destructive/10 text-destructive dark:bg-destructive/20'>
                <Trash2Icon />
              </AlertDialogMedia>
              <AlertDialogTitle>
                {t('components.alertDialog.deleteTitle', {
                  customer: 'Acme Inc.',
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('components.alertDialog.deleteDescription', {
                  count: 24,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>
                {t('reference.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? <Spinner data-icon='inline-start' /> : null}
                {deleting
                  ? t('components.alertDialog.deleting')
                  : t('reference.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.alertDialog.withoutTrigger')}
        description={t('components.alertDialog.withoutTriggerDescription')}
      >
        <Button variant='outline' onClick={() => setDiscardOpen(true)}>
          {t('components.alertDialog.leavePage')}
        </Button>
        <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <AlertDialogContent size='sm'>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('components.alertDialog.discardTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('components.alertDialog.discardDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('components.alertDialog.keepEditing')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                onClick={() => setDiscardOpen(false)}
              >
                {t('components.alertDialog.discard')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ExampleSection>
    </ExamplePage>
  );
}
