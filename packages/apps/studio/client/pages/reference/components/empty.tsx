import { useTranslation } from '@nocobase/i18n/client';
import {
  FileUpIcon,
  FolderOpenIcon,
  MailIcon,
  PlusIcon,
  SearchXIcon,
  UploadIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

import { ExamplePage, ExampleSection } from '../shared';

export default function EmptyExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [invited, setInvited] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  return (
    <ExamplePage
      title={t('components.empty.title')}
      description={t('components.empty.description')}
      docs='https://ui.shadcn.com/docs/components/empty'
    >
      <ExampleSection
        title={t('components.empty.basic')}
        description={t('components.empty.basicDescription')}
        contentClassName='block'
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <FolderOpenIcon />
            </EmptyMedia>
            <EmptyTitle>{t('components.empty.noOrders')}</EmptyTitle>
            <EmptyDescription>
              {t('components.empty.noOrdersDescription')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className='flex-row justify-center gap-2'>
            <Button>
              <PlusIcon data-icon='inline-start' />
              {t('components.empty.createOrder')}
            </Button>
            <Button variant='outline'>
              {t('components.empty.importOrders')}
            </Button>
          </EmptyContent>
        </Empty>
      </ExampleSection>

      <ExampleSection
        title={t('components.empty.outline')}
        description={t('components.empty.outlineDescription')}
        contentClassName='block'
      >
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{t('components.empty.noResults')}</EmptyTitle>
            <EmptyDescription>
              {t('components.empty.noResultsDescription', {
                query: 'thermal printer 58mm',
              })}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' size='sm'>
              {t('components.empty.clearFilters')}
            </Button>
          </EmptyContent>
        </Empty>
      </ExampleSection>

      <ExampleSection
        title={t('components.empty.avatar')}
        description={t('components.empty.avatarDescription')}
        contentClassName='block'
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='default'>
              <Avatar size='lg'>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </EmptyMedia>
            <EmptyTitle>{t('components.empty.noMembers')}</EmptyTitle>
            <EmptyDescription>
              {t('components.empty.noMembersDescription', { name: 'Ava Chen' })}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' size='sm'>
              <PlusIcon data-icon='inline-start' />
              {t('components.empty.inviteMember')}
            </Button>
          </EmptyContent>
        </Empty>
      </ExampleSection>

      <ExampleSection
        title={t('components.empty.inputGroup')}
        description={t('components.empty.inputGroupDescription')}
        contentClassName='block'
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <MailIcon />
            </EmptyMedia>
            <EmptyTitle>{t('components.empty.inviteByEmail')}</EmptyTitle>
            <EmptyDescription>
              {invited
                ? t('components.empty.invitationSent', { email: invited })
                : t('components.empty.inviteByEmailDescription')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <form
              className='w-full max-w-sm'
              onSubmit={(event) => {
                event.preventDefault();
                if (inviteEmail.trim()) {
                  setInvited(inviteEmail.trim());
                  setInviteEmail('');
                }
              }}
            >
              <InputGroup>
                <InputGroupInput
                  type='email'
                  aria-label={t('reference.email')}
                  placeholder={t('components.empty.emailPlaceholder')}
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
                <InputGroupAddon align='inline-end'>
                  <InputGroupButton type='submit' variant='secondary'>
                    {t('components.empty.invite')}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </EmptyContent>
        </Empty>
      </ExampleSection>

      <ExampleSection
        title={t('components.empty.background')}
        description={t('components.empty.backgroundDescription')}
        contentClassName='block p-0 overflow-hidden'
      >
        <Empty className='h-80 bg-linear-to-b from-muted/50 from-30% to-background'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <FileUpIcon />
            </EmptyMedia>
            <EmptyTitle>{t('components.empty.noAttachments')}</EmptyTitle>
            <EmptyDescription>
              {t('components.empty.noAttachmentsDescription')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' size='sm'>
              <UploadIcon data-icon='inline-start' />
              {t('components.empty.uploadFile')}
            </Button>
          </EmptyContent>
        </Empty>
      </ExampleSection>
    </ExamplePage>
  );
}
