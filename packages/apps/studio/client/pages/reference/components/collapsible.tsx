import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  FolderIcon,
  UserIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from 'cn';

import { ExamplePage, ExampleSection } from '../shared';

interface OrgNode {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly OrgNode[];
}

const organization: readonly OrgNode[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    children: [
      {
        id: 'platform',
        name: 'Platform',
        children: [
          { id: 'olivia', name: 'Olivia Martin' },
          { id: 'jackson', name: 'Jackson Lee' },
        ],
      },
      {
        id: 'mobile',
        name: 'Mobile',
        children: [{ id: 'isabella', name: 'Isabella Nguyen' }],
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    children: [
      { id: 'william', name: 'William Kim' },
      { id: 'sofia', name: 'Sofia Davis' },
    ],
  },
  { id: 'ana', name: 'Ana Costa' },
];

const indentByDepth = ['pl-2', 'pl-7', 'pl-12'];

/**
 * Nested collapsibles render a tree; each folder is its own `Collapsible`
 * and the leaves keep the chevron slot empty so labels stay aligned.
 */
function OrgTree({
  nodes,
  depth = 0,
}: {
  readonly nodes: readonly OrgNode[];
  readonly depth?: number;
}): ReactElement {
  const indent = indentByDepth[depth] ?? 'pl-12';

  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node) =>
        node.children ? (
          <li key={node.id}>
            <Collapsible defaultOpen={depth === 0}>
              <CollapsibleTrigger
                render={
                  <Button
                    variant='ghost'
                    size='sm'
                    className={cn('w-full justify-start', indent)}
                  />
                }
              >
                <ChevronRightIcon className='text-muted-foreground transition-transform group-data-panel-open/button:rotate-90' />
                <FolderIcon className='text-muted-foreground' />
                {node.name}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OrgTree nodes={node.children} depth={depth + 1} />
              </CollapsibleContent>
            </Collapsible>
          </li>
        ) : (
          <li key={node.id}>
            <Button
              variant='ghost'
              size='sm'
              className={cn('w-full justify-start font-normal', indent)}
            >
              <span className='size-4 shrink-0' aria-hidden='true' />
              <UserIcon className='text-muted-foreground' />
              {node.name}
            </Button>
          </li>
        ),
      )}
    </ul>
  );
}

export default function CollapsibleExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [orderOpen, setOrderOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <ExamplePage
      title={t('components.collapsible.title')}
      description={t('components.collapsible.description')}
      docs='https://ui.shadcn.com/docs/components/collapsible'
    >
      <ExampleSection
        title={t('components.collapsible.basic')}
        description={t('components.collapsible.basicDescription')}
        contentClassName='block'
      >
        <Collapsible
          open={orderOpen}
          onOpenChange={setOrderOpen}
          className='flex w-full max-w-sm flex-col gap-2'
        >
          <div className='flex items-center justify-between gap-4 px-4'>
            <h4 className='text-sm font-semibold'>ORD-4189</h4>
            <CollapsibleTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('components.collapsible.toggleDetails')}
                />
              }
            >
              <ChevronsUpDownIcon />
            </CollapsibleTrigger>
          </div>
          <div className='flex items-center justify-between rounded-md border px-4 py-2 text-sm'>
            <span className='text-muted-foreground'>
              {t('reference.status')}
            </span>
            <span className='font-medium'>{t('reference.statusShipped')}</span>
          </div>
          <CollapsibleContent className='flex flex-col gap-2'>
            <div className='rounded-md border px-4 py-2 text-sm'>
              <p className='font-medium'>
                {t('components.collapsible.shippingAddress')}
              </p>
              <p className='text-muted-foreground'>
                100 Market St, San Francisco, CA 94105
              </p>
            </div>
            <div className='rounded-md border px-4 py-2 text-sm'>
              <p className='font-medium'>{t('components.collapsible.items')}</p>
              <p className='text-muted-foreground'>2 × Studio Headphones</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ExampleSection>

      <ExampleSection
        title={t('components.collapsible.inCard')}
        description={t('components.collapsible.inCardDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-sm'>
          <CardContent>
            <Collapsible className='rounded-md data-open:bg-muted'>
              <CollapsibleTrigger
                render={<Button variant='ghost' className='w-full' />}
              >
                {t('components.collapsible.productDetails')}
                <ChevronDownIcon className='ml-auto transition-transform group-data-panel-open/button:rotate-180' />
              </CollapsibleTrigger>
              <CollapsibleContent className='flex flex-col items-start gap-2 p-2.5 pt-0 text-sm'>
                <p>{t('components.collapsible.productDetailsBody')}</p>
                <Button size='xs'>
                  {t('components.collapsible.viewSpecs')}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.collapsible.showMore')}
        description={t('components.collapsible.showMoreDescription')}
        contentClassName='block'
      >
        <Collapsible
          open={descriptionOpen}
          onOpenChange={setDescriptionOpen}
          className='w-full max-w-md space-y-2 text-sm'
        >
          <p>{t('components.collapsible.longTextIntro')}</p>
          <CollapsibleContent className='space-y-2'>
            <p>{t('components.collapsible.longTextMiddle')}</p>
            <p>{t('components.collapsible.longTextEnd')}</p>
          </CollapsibleContent>
          <CollapsibleTrigger
            render={
              <Button
                variant='link'
                className='h-auto p-0 text-muted-foreground'
              />
            }
          >
            {descriptionOpen
              ? t('components.collapsible.showLess')
              : t('components.collapsible.showMoreAction')}
            <ChevronDownIcon
              data-icon='inline-end'
              className='transition-transform group-data-panel-open/button:rotate-180'
            />
          </CollapsibleTrigger>
        </Collapsible>
      </ExampleSection>

      <ExampleSection
        title={t('components.collapsible.advanced')}
        description={t('components.collapsible.advancedDescription')}
        contentClassName='block'
      >
        <Card size='sm' className='w-full max-w-sm'>
          <CardHeader>
            <CardTitle>{t('components.collapsible.webhookTitle')}</CardTitle>
            <CardDescription>
              {t('components.collapsible.webhookDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              className='flex flex-col gap-4'
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor='webhook-url'>
                    {t('components.collapsible.endpointUrl')}
                  </FieldLabel>
                  <Input
                    id='webhook-url'
                    placeholder='https://hooks.acme.com/orders'
                  />
                </Field>
                <CollapsibleContent className='flex flex-col gap-4'>
                  <Field>
                    <FieldLabel htmlFor='webhook-secret'>
                      {t('components.collapsible.signingSecret')}
                    </FieldLabel>
                    <Input id='webhook-secret' type='password' />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='webhook-retries'>
                      {t('components.collapsible.maxRetries')}
                    </FieldLabel>
                    <Input
                      id='webhook-retries'
                      type='number'
                      inputMode='numeric'
                      defaultValue={3}
                      min={0}
                      max={10}
                    />
                  </Field>
                </CollapsibleContent>
              </FieldGroup>
              <CollapsibleTrigger
                render={
                  <Button variant='ghost' size='sm' className='self-start' />
                }
              >
                {t('components.collapsible.advancedOptions')}
                <ChevronDownIcon
                  data-icon='inline-end'
                  className='transition-transform group-data-panel-open/button:rotate-180'
                />
              </CollapsibleTrigger>
            </Collapsible>
          </CardContent>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.collapsible.tree')}
        description={t('components.collapsible.treeDescription')}
        contentClassName='block'
      >
        <div className='w-full max-w-xs rounded-lg border p-2'>
          <OrgTree nodes={organization} />
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
