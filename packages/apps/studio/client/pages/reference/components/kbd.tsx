import { useTranslation } from '@nocobase/i18n/client';
import { PrinterIcon, SaveIcon, SearchIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ExamplePage, ExampleSection } from '../shared';

const shortcuts = [
  {
    id: 'new-order',
    labelKey: 'components.kbd.shortcutNewOrder',
    keys: ['⌘', 'N'],
  },
  { id: 'search', labelKey: 'components.kbd.shortcutSearch', keys: ['⌘', 'K'] },
  {
    id: 'sidebar',
    labelKey: 'components.kbd.shortcutSidebar',
    keys: ['⌘', 'B'],
  },
  {
    id: 'save',
    labelKey: 'components.kbd.shortcutSaveDraft',
    keys: ['⌘', 'S'],
  },
  { id: 'help', labelKey: 'components.kbd.shortcutHelp', keys: ['?'] },
];

export default function KbdExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <ExamplePage
        title={t('components.kbd.title')}
        description={t('components.kbd.description')}
        docs='https://ui.shadcn.com/docs/components/kbd'
      >
        <ExampleSection
          title={t('components.kbd.basic')}
          description={t('components.kbd.basicDescription')}
        >
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>⌥</Kbd>
          <Kbd>Ctrl</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>⏎</Kbd>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <span className='text-xs text-muted-foreground'>+</span>
            <Kbd>B</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </ExampleSection>

        <ExampleSection
          title={t('components.kbd.inText')}
          description={t('components.kbd.inTextDescription')}
          contentClassName='block'
        >
          <p className='max-w-md text-sm text-muted-foreground'>
            {t('components.kbd.hintBefore')}{' '}
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>{' '}
            {t('components.kbd.hintAfter')}
          </p>
        </ExampleSection>

        <ExampleSection
          title={t('components.kbd.inButton')}
          description={t('components.kbd.inButtonDescription')}
        >
          <Button variant='outline'>
            {t('reference.save')}
            <Kbd data-icon='inline-end' className='translate-x-0.5'>
              ⌘S
            </Kbd>
          </Button>
          <Button>
            {t('reference.submit')}
            <Kbd data-icon='inline-end' className='translate-x-0.5'>
              ⏎
            </Kbd>
          </Button>
          <Button variant='ghost'>
            {t('reference.cancel')}
            <Kbd data-icon='inline-end' className='translate-x-0.5'>
              Esc
            </Kbd>
          </Button>
        </ExampleSection>

        <ExampleSection
          title={t('components.kbd.inTooltip')}
          description={t('components.kbd.inTooltipDescription')}
        >
          <ButtonGroup>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label={t('reference.save')}
                  />
                }
              >
                <SaveIcon />
              </TooltipTrigger>
              <TooltipContent>
                {t('components.kbd.saveChanges')}
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>S</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label={t('components.kbd.print')}
                  />
                }
              >
                <PrinterIcon />
              </TooltipTrigger>
              <TooltipContent>
                {t('components.kbd.printInvoice')}
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>P</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
        </ExampleSection>

        <ExampleSection
          title={t('components.kbd.inInput')}
          description={t('components.kbd.inInputDescription')}
          contentClassName='block'
        >
          <InputGroup className='max-w-sm'>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t('components.kbd.searchPlaceholder')}
              aria-label={t('reference.search')}
            />
            <InputGroupAddon align='inline-end'>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </InputGroupAddon>
          </InputGroup>
        </ExampleSection>

        <ExampleSection
          title={t('components.kbd.shortcutList')}
          description={t('components.kbd.shortcutListDescription')}
          contentClassName='block'
        >
          <dl className='w-full max-w-sm divide-y rounded-lg border text-sm'>
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                className='flex items-center justify-between gap-4 px-4 py-2.5'
              >
                <dt>{t(shortcut.labelKey)}</dt>
                <dd>
                  <KbdGroup>
                    {shortcut.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </KbdGroup>
                </dd>
              </div>
            ))}
          </dl>
        </ExampleSection>
      </ExamplePage>
    </TooltipProvider>
  );
}
