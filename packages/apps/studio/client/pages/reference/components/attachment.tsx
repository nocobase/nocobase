import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckIcon,
  ClockIcon,
  FileCodeIcon,
  FileTextIcon,
  FileWarningIcon,
  PaperclipIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  TableIcon,
  XIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from '@/components/ui/message';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?w=900&auto=format&fit=crop&q=80`;

const images = [
  {
    name: 'warehouse-a.jpg',
    meta: 'JPG · 1.1 MB',
    src: unsplash('photo-1497366754035-f200968a6e72'),
  },
  {
    name: 'loading-dock.jpg',
    meta: 'JPG · 940 KB',
    src: unsplash('photo-1497215728101-856f4ea42174'),
  },
  {
    name: 'front-office.png',
    meta: 'PNG · 820 KB',
    src: unsplash('photo-1497366811353-6870744d04b2'),
  },
];

export default function AttachmentExamplePage(): ReactElement {
  const { t } = useTranslation();

  const removeLabel = (file: string): string =>
    t('components.attachment.removeFile', { file });

  return (
    <ExamplePage
      title={t('components.attachment.title')}
      description={t('components.attachment.description')}
      docs='https://ui.shadcn.com/docs/components/attachment'
    >
      <ExampleSection
        title={t('components.attachment.basic')}
        description={t('components.attachment.basicDescription')}
      >
        <Attachment>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={removeLabel('sales-dashboard.pdf')}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment>
          <AttachmentMedia>
            <TableIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>customers.csv</AttachmentTitle>
            <AttachmentDescription>CSV · 18 KB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={removeLabel('customers.csv')}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment>
          <AttachmentMedia variant='image'>
            <img src={images[0]?.src} alt='' loading='lazy' />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>warehouse-a.jpg</AttachmentTitle>
            <AttachmentDescription>JPG · 1.1 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </ExampleSection>

      <ExampleSection
        title={t('components.attachment.states')}
        description={t('components.attachment.statesDescription')}
        contentClassName='grid gap-2'
      >
        <Attachment state='idle' className='w-full max-w-sm'>
          <AttachmentMedia>
            <ClockIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>contract-draft.pdf</AttachmentTitle>
            <AttachmentDescription>
              {t('components.attachment.readyToUpload')}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={removeLabel('contract-draft.pdf')}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state='uploading' className='w-full max-w-sm'>
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>product-catalog.zip</AttachmentTitle>
            <AttachmentDescription>
              {t('components.attachment.uploadingProgress', {
                percent: '64%',
              })}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label={t('components.attachment.cancelUpload')}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state='processing' className='w-full max-w-sm'>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>market-research.pdf</AttachmentTitle>
            <AttachmentDescription>
              {t('components.attachment.processingDocument')}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={removeLabel('market-research.pdf')}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state='error' className='w-full max-w-sm'>
          <AttachmentMedia>
            <FileWarningIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
            <AttachmentDescription>
              {t('components.attachment.uploadFailed')}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label={t('components.attachment.retryUpload')}
            >
              <RefreshCwIcon />
            </AttachmentAction>
            <AttachmentAction aria-label={removeLabel('financial-model.xlsx')}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state='done' className='w-full max-w-sm'>
          <AttachmentMedia>
            <CheckIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>signed-agreement.pdf</AttachmentTitle>
            <AttachmentDescription>
              {t('components.attachment.uploadedMeta', { size: '1.8 MB' })}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={removeLabel('signed-agreement.pdf')}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </ExampleSection>

      <ExampleSection
        title={t('components.attachment.sizes')}
        description={t('components.attachment.sizesDescription')}
        contentClassName='grid gap-3'
      >
        <Attachment size='default' className='w-full max-w-sm'>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment size='sm' className='w-full max-w-sm'>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment size='xs' className='w-full max-w-sm'>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      </ExampleSection>

      <ExampleSection
        title={t('components.attachment.images')}
        description={t('components.attachment.imagesDescription')}
        contentClassName='block'
      >
        <AttachmentGroup className='w-full max-w-sm'>
          {images.map((image) => (
            <Attachment key={image.name} orientation='vertical'>
              <AttachmentMedia variant='image'>
                <img src={image.src} alt='' loading='lazy' />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{image.name}</AttachmentTitle>
                <AttachmentDescription>{image.meta}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction aria-label={removeLabel(image.name)}>
                  <XIcon />
                </AttachmentAction>
              </AttachmentActions>
              <AttachmentTrigger
                render={
                  <a
                    href={image.src}
                    target='_blank'
                    rel='noreferrer'
                    aria-label={t('components.attachment.openFile', {
                      file: image.name,
                    })}
                  />
                }
              />
            </Attachment>
          ))}
        </AttachmentGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.attachment.conversation')}
        description={t('components.attachment.conversationDescription')}
        contentClassName='block'
      >
        <MessageGroup className='w-full max-w-md'>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.attachment.conversationCustomer')}
                </BubbleContent>
              </Bubble>
              <AttachmentGroup>
                <Attachment size='sm'>
                  <AttachmentMedia>
                    <FileTextIcon />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>signed-agreement.pdf</AttachmentTitle>
                    <AttachmentDescription>PDF · 1.8 MB</AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
                <Attachment size='sm'>
                  <AttachmentMedia>
                    <TableIcon />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>pricing-2026.xlsx</AttachmentTitle>
                    <AttachmentDescription>XLSX · 48 KB</AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
              </AttachmentGroup>
              <MessageFooter>Ana Costa · 09:41</MessageFooter>
            </MessageContent>
          </Message>
          <Message align='end'>
            <MessageContent>
              <Bubble align='end'>
                <BubbleContent>
                  {t('components.attachment.conversationReply')}
                </BubbleContent>
              </Bubble>
              <Attachment size='sm' state='processing'>
                <AttachmentMedia>
                  <FileCodeIcon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>countersigned-agreement.pdf</AttachmentTitle>
                  <AttachmentDescription>
                    {t('components.attachment.processingDocument')}
                  </AttachmentDescription>
                </AttachmentContent>
              </Attachment>
              <MessageFooter>09:44</MessageFooter>
            </MessageContent>
          </Message>
        </MessageGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.attachment.composer')}
        description={t('components.attachment.composerDescription')}
        contentClassName='block'
      >
        <InputGroup className='w-full max-w-md'>
          <InputGroupAddon align='block-start'>
            <AttachmentGroup className='w-full py-0'>
              <Attachment size='xs'>
                <AttachmentMedia>
                  <FileTextIcon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>quote-q3.pdf</AttachmentTitle>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction aria-label={removeLabel('quote-q3.pdf')}>
                    <XIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
              <Attachment size='xs' state='uploading'>
                <AttachmentMedia>
                  <Spinner />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>site-photos.zip</AttachmentTitle>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={t('components.attachment.cancelUpload')}
                  >
                    <XIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            </AttachmentGroup>
          </InputGroupAddon>
          <InputGroupTextarea
            rows={2}
            placeholder={t('components.attachment.composerPlaceholder')}
            aria-label={t('components.attachment.composerLabel')}
          />
          <InputGroupAddon align='block-end' className='justify-between'>
            <InputGroupButton
              size='icon-xs'
              aria-label={t('components.attachment.attachFile')}
            >
              <PaperclipIcon />
            </InputGroupButton>
            <InputGroupButton variant='default'>
              {t('components.attachment.send')}
              <SendHorizontalIcon data-icon='inline-end' />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
