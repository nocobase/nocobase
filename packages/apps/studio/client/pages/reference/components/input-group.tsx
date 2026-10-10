import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  SearchIcon,
  TicketPercentIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';

import { ExamplePage, ExampleSection } from '../shared';

const CUSTOMERS = [
  'Northwind Traders',
  'Acme Supply Co.',
  'Blue Harbor Logistics',
  'Cedar Grove Retail',
  'Meridian Health',
] as const;

const API_KEY = 'nb_live_9f2c41d8a7e04b13';

const NOTE_LIMIT = 280;

export default function InputGroupExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [discount, setDiscount] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(
    'Deliver to the loading dock before 10:00. Call ahead for the gate code.',
  );

  const matches = CUSTOMERS.filter((customer) =>
    customer.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(API_KEY).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <ExamplePage
      title={t('components.inputGroup.title')}
      description={t('components.inputGroup.description')}
      docs='https://ui.shadcn.com/docs/components/input-group'
    >
      <ExampleSection
        title={t('components.inputGroup.addons')}
        description={t('components.inputGroup.addonsDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <InputGroup>
          <InputGroupAddon align='inline-start'>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t('components.inputGroup.amountLabel')}
            defaultValue='1,248.00'
            inputMode='decimal'
          />
          <InputGroupAddon align='inline-end'>
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupAddon align='inline-start'>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t('components.inputGroup.websiteLabel')}
            defaultValue='northwind'
          />
          <InputGroupAddon align='inline-end'>
            <InputGroupText>.example.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.inputGroup.search')}
        description={t('components.inputGroup.searchDescription')}
        contentClassName='block space-y-3'
      >
        <InputGroup className='max-w-md'>
          <InputGroupAddon align='inline-start'>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t('reference.search')}
            placeholder={t('components.inputGroup.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton size='xs' onClick={() => setQuery('')}>
                {t('reference.reset')}
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        {matches.length > 0 ? (
          <ul className='max-w-md space-y-1 text-sm'>
            {matches.map((customer) => (
              <li
                key={customer}
                className='flex items-center justify-between gap-4 rounded-md px-2 py-1.5 hover:bg-muted'
              >
                <span>{customer}</span>
                <span className='text-xs text-muted-foreground'>
                  {t('reference.customer')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('components.inputGroup.searchEmpty', { query })}
          </p>
        )}
      </ExampleSection>

      <ExampleSection
        title={t('components.inputGroup.inlineButton')}
        description={t('components.inputGroup.inlineButtonDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <div className='space-y-2'>
          <InputGroup>
            <InputGroupAddon align='inline-start'>
              <TicketPercentIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t('components.inputGroup.discountLabel')}
              placeholder={t('components.inputGroup.discountPlaceholder')}
              value={discount}
              onChange={(event) =>
                setDiscount(event.target.value.toUpperCase())
              }
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='xs'
                variant='default'
                disabled={discount.trim().length === 0}
                onClick={() => setAppliedDiscount(discount.trim())}
              >
                {t('reference.apply')}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {appliedDiscount ? (
            <p className='text-sm text-muted-foreground'>
              {t('components.inputGroup.discountApplied', {
                code: appliedDiscount,
              })}
            </p>
          ) : null}
        </div>
        <InputGroup>
          <InputGroupInput
            aria-label={t('components.inputGroup.apiKeyLabel')}
            className='font-mono'
            value={API_KEY}
            readOnly
          />
          <InputGroupAddon align='inline-end'>
            <InputGroupButton
              size='icon-xs'
              aria-label={t('reference.copy')}
              onClick={handleCopy}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.inputGroup.textarea')}
        description={t('components.inputGroup.textareaDescription')}
        contentClassName='block'
      >
        <InputGroup className='max-w-md'>
          <InputGroupAddon align='block-start' className='border-b'>
            <InputGroupText className='font-medium'>
              <FileTextIcon />
              {t('components.inputGroup.deliveryNote', { number: 'ORD-1042' })}
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupTextarea
            aria-label={t('components.inputGroup.deliveryNoteLabel')}
            className='min-h-24'
            maxLength={NOTE_LIMIT}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <InputGroupAddon align='block-end' className='border-t'>
            <InputGroupText className='text-xs tabular-nums'>
              {t('components.inputGroup.characterCount', {
                used: note.length,
                limit: NOTE_LIMIT,
              })}
            </InputGroupText>
            <InputGroupButton size='sm' variant='default' className='ml-auto'>
              {t('reference.save')}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
