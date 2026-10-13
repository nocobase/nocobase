import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { ExamplePage, ExampleSection } from '../shared';

export default function ButtonGroupExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  return (
    <ExamplePage
      title={t('components.buttonGroup.title')}
      description={t('components.buttonGroup.description')}
      docs='https://ui.shadcn.com/docs/components/button-group'
    >
      <ExampleSection
        title={t('components.buttonGroup.basic')}
        description={t('components.buttonGroup.basicDescription')}
      >
        <ButtonGroup aria-label={t('components.buttonGroup.reviewActions')}>
          <Button variant='outline'>
            {t('components.buttonGroup.approve')}
          </Button>
          <Button variant='outline'>
            {t('components.buttonGroup.reject')}
          </Button>
          <Button variant='outline'>
            {t('components.buttonGroup.reassign')}
          </Button>
        </ButtonGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.buttonGroup.sizes')}
        description={t('components.buttonGroup.sizesDescription')}
        contentClassName='flex-col items-start'
      >
        <ButtonGroup>
          <Button variant='outline' size='sm'>
            {t('reference.previous')}
          </Button>
          <Button variant='outline' size='sm'>
            {t('reference.next')}
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={t('reference.add')}
          >
            <PlusIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant='outline'>{t('reference.previous')}</Button>
          <Button variant='outline'>{t('reference.next')}</Button>
          <Button variant='outline' size='icon' aria-label={t('reference.add')}>
            <PlusIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant='outline' size='lg'>
            {t('reference.previous')}
          </Button>
          <Button variant='outline' size='lg'>
            {t('reference.next')}
          </Button>
          <Button
            variant='outline'
            size='icon-lg'
            aria-label={t('reference.add')}
          >
            <PlusIcon />
          </Button>
        </ButtonGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.buttonGroup.orientation')}
        description={t('components.buttonGroup.orientationDescription')}
      >
        <ButtonGroup
          orientation='vertical'
          aria-label={t('components.buttonGroup.zoomControls')}
          className='h-fit'
        >
          <Button
            variant='outline'
            size='icon'
            aria-label={t('components.buttonGroup.zoomIn')}
          >
            <ZoomInIcon />
          </Button>
          <Button
            variant='outline'
            size='icon'
            aria-label={t('components.buttonGroup.zoomOut')}
          >
            <ZoomOutIcon />
          </Button>
        </ButtonGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.buttonGroup.split')}
        description={t('components.buttonGroup.splitDescription')}
      >
        <ButtonGroup>
          <Button>{t('reference.save')}</Button>
          <ButtonGroupSeparator />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size='icon'
                  aria-label={t('components.buttonGroup.moreSaveOptions')}
                />
              }
            >
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  {t('components.buttonGroup.saveAsDraft')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {t('components.buttonGroup.saveAndClose')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive'>
                {t('components.buttonGroup.discardChanges')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant='secondary' size='sm'>
            {t('reference.copy')}
          </Button>
          <ButtonGroupSeparator />
          <Button variant='secondary' size='sm'>
            {t('components.buttonGroup.paste')}
          </Button>
        </ButtonGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.buttonGroup.withInput')}
        description={t('components.buttonGroup.withInputDescription')}
      >
        <ButtonGroup aria-label={t('reference.quantity')}>
          <Button
            variant='outline'
            size='icon'
            aria-label={t('components.buttonGroup.decrease')}
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <MinusIcon />
          </Button>
          <Input
            value={quantity}
            readOnly
            aria-label={t('reference.quantity')}
            className='w-14 text-center tabular-nums'
          />
          <Button
            variant='outline'
            size='icon'
            aria-label={t('components.buttonGroup.increase')}
            onClick={() => setQuantity((value) => value + 1)}
          >
            <PlusIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>USD</ButtonGroupText>
          <Input
            placeholder='0.00'
            inputMode='decimal'
            aria-label={t('reference.price')}
            className='w-28'
          />
          <Button variant='outline'>{t('reference.apply')}</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Input
            placeholder={t('reference.search')}
            aria-label={t('reference.search')}
            className='w-48'
          />
          <Button
            variant='outline'
            size='icon'
            aria-label={t('reference.search')}
          >
            <SearchIcon />
          </Button>
        </ButtonGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.buttonGroup.nested')}
        description={t('components.buttonGroup.nestedDescription')}
      >
        <ButtonGroup aria-label={t('components.buttonGroup.ticketToolbar')}>
          <ButtonGroup>
            <Button
              variant='outline'
              size='icon'
              aria-label={t('reference.back')}
            >
              <ArrowLeftIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant='outline'>
              {t('components.buttonGroup.approve')}
            </Button>
            <Button variant='outline'>
              {t('components.buttonGroup.reject')}
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant='outline'>
              {t('components.buttonGroup.reassign')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label={t('reference.more')}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-44'>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    {t('components.buttonGroup.markAsRead')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {t('components.buttonGroup.snooze')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant='destructive'>
                  {t('reference.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </ButtonGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
