/**
 * Customers — a directory that switches between a card grid and a data table,
 * with a profile panel and an add dialog.
 *
 * Skeleton: `PageHeader` → toolbar of search `Input`, tier `Select`, match
 * count and a grid/table `ToggleGroup` → `Empty` state, card grid or
 * `DataTable` → `Sheet` profile with details/activity/notes `Tabs` → `Dialog`
 * add form. Helpers follow the page: `ProfileRow`, `ContactHoverCard`,
 * `CustomerMenu`.
 *
 * Patterns, by the component or block that holds them:
 * - View-mode switch: the `ToggleGroup` in the toolbar and `view`.
 * - Client-side search plus facet filter: `visible` and the toolbar controls.
 * - No-results state with a reset action: the `Empty` block.
 * - Entity card grid: the `Card` grid block.
 * - Hover contact card: `ContactHoverCard`.
 * - One actions menu reused by card and row: `CustomerMenu`.
 * - Table columns reusing the card widgets: `columns`.
 * - Tabbed detail panel with definition-list rows: the `Sheet` block and
 *   `ProfileRow`.
 * - Create form with a disabled submit while saving: `submitCustomer`.
 *
 * Demonstration filler to leave behind: the inert Import button, the
 * `setTimeout` fake save, the seeded activity and notes behind the profile
 * tabs and the `mailto:` menu item.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  BuildingIcon,
  CalendarIcon,
  CopyIcon,
  LayoutGridIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PhoneIcon,
  PhoneCallIcon,
  PlusIcon,
  SearchXIcon,
  StickyNoteIcon,
  TableIcon,
  UploadIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from 'lucide-react';
import {
  type ComponentType,
  type FormEvent,
  type ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from '@/components/ui/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { ExamplePage } from '../../shared';
import {
  CUSTOMERS,
  CUSTOMER_TIERS,
  type Customer,
  type CustomerActivityKind,
  type CustomerStatus,
  type CustomerTier,
  customerInitials,
  matchesQuery,
} from './customers.data';

type ViewMode = 'grid' | 'table';

type TierFilter = 'all' | CustomerTier;

const TIER_BADGE: Record<CustomerTier, 'default' | 'secondary' | 'outline'> = {
  enterprise: 'default',
  business: 'secondary',
  starter: 'outline',
};

const STATUS_BADGE: Record<
  CustomerStatus,
  'secondary' | 'outline' | 'destructive'
> = {
  active: 'secondary',
  pending: 'outline',
  inactive: 'destructive',
};

const ACTIVITY_ICON: Record<CustomerActivityKind, ComponentType> = {
  order: PackageIcon,
  email: MailIcon,
  call: PhoneCallIcon,
  meeting: UsersRoundIcon,
  note: StickyNoteIcon,
};

function formValue(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export default function CustomersExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<readonly Customer[]>(CUSTOMERS);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<TierFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [profile, setProfile] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [i18n.language],
  );

  const tierLabel = useCallback(
    (value: CustomerTier): string => t(`examples.customers.tier.${value}`),
    [t],
  );

  const statusLabel = useCallback(
    (value: CustomerStatus): string => t(`examples.customers.status.${value}`),
    [t],
  );

  const visible = useMemo(
    () =>
      rows.filter(
        (customer) =>
          (tier === 'all' || customer.tier === tier) &&
          matchesQuery(customer, query),
      ),
    [rows, tier, query],
  );

  const copyEmail = useCallback(
    (customer: Customer): void => {
      void navigator.clipboard.writeText(customer.email);
      toast.add({
        type: 'success',
        title: t('reference.copied'),
        description: customer.email,
      });
    },
    [t],
  );

  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked)
            }
            aria-label={t('examples.customers.selectAll')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
            aria-label={t('examples.customers.selectRow')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.name')}
          />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar size='sm'>
              <AvatarFallback>{row.original.initials}</AvatarFallback>
            </Avatar>
            <ContactHoverCard customer={row.original} />
          </div>
        ),
      },
      {
        accessorKey: 'company',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.company')}
          />
        ),
        cell: ({ row }) => (
          <div className='leading-tight'>
            <div>{row.original.company}</div>
            <div className='text-xs text-muted-foreground'>
              {row.original.city}, {row.original.country}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'tier',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.tier')}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={TIER_BADGE[row.original.tier]}>
            {tierLabel(row.original.tier)}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.status')}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={STATUS_BADGE[row.original.status]}>
            {statusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'orders',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.orders')}
            className='justify-end'
          />
        ),
        cell: ({ row }) => (
          <div className='text-right tabular-nums'>{row.original.orders}</div>
        ),
      },
      {
        accessorKey: 'lifetimeValue',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.lifetimeValue')}
            className='justify-end'
          />
        ),
        cell: ({ row }) => (
          <div className='text-right font-medium tabular-nums'>
            {currency.format(row.original.lifetimeValue)}
          </div>
        ),
      },
      {
        accessorKey: 'lastActiveAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('examples.customers.columns.lastActiveAt')}
          />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {format(new Date(row.original.lastActiveAt), 'PP')}
          </span>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className='text-right'>
            <CustomerMenu
              customer={row.original}
              onOpenProfile={setProfile}
              onCopyEmail={copyEmail}
            />
          </div>
        ),
      },
    ],
    [t, currency, tierLabel, statusLabel, copyEmail],
  );

  const submitCustomer = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = formValue(data, 'name');
    const email = formValue(data, 'email');
    const company = formValue(data, 'company');
    const nextTier = (formValue(data, 'tier') || 'starter') as CustomerTier;
    const note = formValue(data, 'note');
    if (!name || !email || !company) return;
    const now = new Date().toISOString();
    const customer: Customer = {
      id: `cus_${100 + rows.length + 1}`,
      name,
      initials: customerInitials(name),
      email,
      phone: formValue(data, 'phone'),
      company,
      title: formValue(data, 'title'),
      tier: nextTier,
      status: 'pending',
      lifetimeValue: 0,
      orders: 0,
      tags: [],
      city: formValue(data, 'city'),
      country: formValue(data, 'country'),
      since: now,
      lastActiveAt: now,
      activity: [],
      notes: note ? [{ id: 'n1', author: name, body: note, at: now }] : [],
    };
    setSaving(true);
    // Nothing reaches a server here; the delay only shows the pending state.
    setTimeout(() => {
      setRows((current) => [customer, ...current]);
      setSaving(false);
      setCreating(false);
      toast.add({
        type: 'success',
        title: t('examples.customers.created'),
        description: customer.name,
      });
    }, 600);
  };

  return (
    <ExamplePage
      title={t('examples.customers.title')}
      description={t('examples.customers.description')}
      actions={
        <>
          <Button variant='outline'>
            <UploadIcon data-icon='inline-start' />
            {t('examples.customers.import')}
          </Button>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon data-icon='inline-start' />
            {t('examples.customers.addCustomer')}
          </Button>
        </>
      }
    >
      <Toaster />

      <div className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('examples.customers.searchPlaceholder')}
            aria-label={t('examples.customers.searchPlaceholder')}
            className='max-w-xs'
          />
          <Select
            value={tier}
            onValueChange={(value: TierFilter | null) =>
              setTier(value ?? 'all')
            }
          >
            <SelectTrigger className='w-44'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectItem value='all'>
                {t('examples.customers.allTiers')}
              </SelectItem>
              {CUSTOMER_TIERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {tierLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-sm text-muted-foreground tabular-nums'>
            {t('examples.customers.matchCount', { count: visible.length })}
          </span>
          <ToggleGroup
            variant='outline'
            size='sm'
            spacing={0}
            className='ml-auto'
            value={[view]}
            onValueChange={(values: string[]) => {
              const [next] = values;
              if (next) setView(next as ViewMode);
            }}
            aria-label={t('examples.customers.viewLabel')}
          >
            <ToggleGroupItem
              value='grid'
              aria-label={t('examples.customers.gridView')}
            >
              <LayoutGridIcon />
            </ToggleGroupItem>
            <ToggleGroupItem
              value='table'
              aria-label={t('examples.customers.tableView')}
            >
              <TableIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {visible.length === 0 ? (
          <Empty className='rounded-lg border bg-card'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>{t('examples.customers.emptyTitle')}</EmptyTitle>
              <EmptyDescription>
                {t('examples.customers.emptyDescription')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant='outline'
                onClick={() => {
                  setQuery('');
                  setTier('all');
                }}
              >
                {t('reference.reset')}
              </Button>
            </EmptyContent>
          </Empty>
        ) : view === 'grid' ? (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {visible.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarFallback>{customer.initials}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                      <CardTitle className='truncate'>
                        <ContactHoverCard customer={customer} />
                      </CardTitle>
                      <CardDescription className='truncate'>
                        {customer.title} · {customer.company}
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction>
                    <CustomerMenu
                      customer={customer}
                      onOpenProfile={setProfile}
                      onCopyEmail={copyEmail}
                    />
                  </CardAction>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant={TIER_BADGE[customer.tier]}>
                      {tierLabel(customer.tier)}
                    </Badge>
                    <Badge variant={STATUS_BADGE[customer.status]}>
                      {statusLabel(customer.status)}
                    </Badge>
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div>
                      <div className='text-xs text-muted-foreground'>
                        {t('examples.customers.columns.lifetimeValue')}
                      </div>
                      <div className='font-medium tabular-nums'>
                        {currency.format(customer.lifetimeValue)}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>
                        {t('examples.customers.columns.orders')}
                      </div>
                      <div className='font-medium tabular-nums'>
                        {customer.orders}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='justify-between text-xs text-muted-foreground'>
                  <span className='inline-flex items-center gap-1.5'>
                    <MapPinIcon className='size-3.5' aria-hidden='true' />
                    {customer.city}
                  </span>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setProfile(customer)}
                  >
                    {t('examples.customers.openProfile')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={visible}
            pageSize={10}
            getRowId={(customer) => customer.id}
            emptyMessage={t('examples.customers.emptyTitle')}
            toolbar={(table) => (
              <DataTableViewOptions
                table={table}
                getColumnLabel={(column) =>
                  t(`examples.customers.columns.${column.id}`)
                }
              />
            )}
          />
        )}
      </div>

      <Sheet
        open={profile !== null}
        onOpenChange={(open) => {
          if (!open) setProfile(null);
        }}
      >
        <SheetContent className='sm:max-w-lg'>
          {profile ? (
            <>
              <SheetHeader>
                <SheetTitle>{profile.name}</SheetTitle>
                <SheetDescription>
                  {profile.title} · {profile.company}
                </SheetDescription>
              </SheetHeader>
              <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-4'>
                <div className='flex items-center gap-3'>
                  <Avatar size='lg'>
                    <AvatarFallback>{profile.initials}</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant={TIER_BADGE[profile.tier]}>
                      {tierLabel(profile.tier)}
                    </Badge>
                    <Badge variant={STATUS_BADGE[profile.status]}>
                      {statusLabel(profile.status)}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <Tabs defaultValue='details' className='gap-5'>
                  <TabsList variant='line'>
                    <TabsTrigger value='details'>
                      {t('examples.customers.tabs.details')}
                    </TabsTrigger>
                    <TabsTrigger value='activity'>
                      {t('examples.customers.tabs.activity')}
                    </TabsTrigger>
                    <TabsTrigger value='notes'>
                      {t('examples.customers.tabs.notes')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='details'>
                    <dl className='grid gap-3 text-sm'>
                      <ProfileRow
                        label={t('reference.email')}
                        value={profile.email}
                      />
                      <ProfileRow
                        label={t('reference.phone')}
                        value={profile.phone}
                      />
                      <ProfileRow
                        label={t('examples.customers.columns.company')}
                        value={profile.company}
                      />
                      <ProfileRow
                        label={t('examples.customers.location')}
                        value={`${profile.city}, ${profile.country}`}
                      />
                      <ProfileRow
                        label={t('examples.customers.since')}
                        value={format(new Date(profile.since), 'PP')}
                      />
                      <ProfileRow
                        label={t('examples.customers.columns.lifetimeValue')}
                        value={currency.format(profile.lifetimeValue)}
                      />
                      <ProfileRow
                        label={t('examples.customers.columns.orders')}
                        value={String(profile.orders)}
                      />
                    </dl>
                  </TabsContent>

                  <TabsContent value='activity'>
                    {profile.activity.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>
                        {t('examples.customers.noActivity')}
                      </p>
                    ) : (
                      <ItemGroup>
                        {profile.activity.map((entry) => {
                          const Icon = ACTIVITY_ICON[entry.kind];
                          return (
                            <Item key={entry.id} size='sm' className='px-0'>
                              <ItemMedia
                                variant='icon'
                                className='text-muted-foreground'
                              >
                                <Icon />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{entry.summary}</ItemTitle>
                                <ItemDescription>
                                  {t(
                                    `examples.customers.activity.${entry.kind}`,
                                  )}{' '}
                                  · {format(new Date(entry.at), 'PPp')}
                                </ItemDescription>
                              </ItemContent>
                            </Item>
                          );
                        })}
                      </ItemGroup>
                    )}
                  </TabsContent>

                  <TabsContent value='notes'>
                    {profile.notes.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>
                        {t('examples.customers.noNotes')}
                      </p>
                    ) : (
                      <div className='space-y-3'>
                        {profile.notes.map((note) => (
                          <div
                            key={note.id}
                            className='rounded-lg border p-3 text-sm'
                          >
                            <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                              <span className='font-medium text-foreground'>
                                {note.author}
                              </span>
                              <span>{format(new Date(note.at), 'PP')}</span>
                            </div>
                            <p className='pt-1.5'>{note.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className='sm:max-w-lg'>
          <form onSubmit={submitCustomer}>
            <DialogHeader>
              <DialogTitle>{t('examples.customers.addCustomer')}</DialogTitle>
              <DialogDescription>
                {t('examples.customers.addDescription')}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className='py-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='customer-name'>
                    {t('reference.name')}
                  </FieldLabel>
                  <Input id='customer-name' name='name' required />
                </Field>
                <Field>
                  <FieldLabel htmlFor='customer-title'>
                    {t('examples.customers.jobTitle')}
                  </FieldLabel>
                  <Input id='customer-title' name='title' />
                </Field>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='customer-email'>
                    {t('reference.email')}
                  </FieldLabel>
                  <Input
                    id='customer-email'
                    name='email'
                    type='email'
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='customer-phone'>
                    {t('reference.phone')}
                  </FieldLabel>
                  <Input id='customer-phone' name='phone' type='tel' />
                </Field>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='customer-company'>
                    {t('examples.customers.columns.company')}
                  </FieldLabel>
                  <Input id='customer-company' name='company' required />
                </Field>
                <Field>
                  <FieldLabel htmlFor='customer-tier'>
                    {t('examples.customers.columns.tier')}
                  </FieldLabel>
                  <Select name='tier' defaultValue='starter'>
                    <SelectTrigger id='customer-tier' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      {CUSTOMER_TIERS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {tierLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='customer-city'>
                    {t('examples.customers.city')}
                  </FieldLabel>
                  <Input id='customer-city' name='city' />
                </Field>
                <Field>
                  <FieldLabel htmlFor='customer-country'>
                    {t('examples.customers.country')}
                  </FieldLabel>
                  <Input id='customer-country' name='country' />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor='customer-note'>
                  {t('reference.notes')}
                </FieldLabel>
                <Textarea
                  id='customer-note'
                  name='note'
                  rows={3}
                  placeholder={t('examples.customers.notePlaceholder')}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setCreating(false)}
              >
                {t('reference.cancel')}
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? t('reference.loading') : t('reference.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ExamplePage>
  );
}

interface ProfileRowProps {
  readonly label: string;
  readonly value: string;
}

function ProfileRow({ label, value }: ProfileRowProps): ReactElement {
  return (
    <div className='flex items-baseline justify-between gap-4'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-right'>{value}</dd>
    </div>
  );
}

interface ContactHoverCardProps {
  readonly customer: Customer;
}

/** The name, with the contact details one hover away instead of in a column. */
function ContactHoverCard({ customer }: ContactHoverCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type='button'
            className='cursor-default font-medium underline-offset-4 hover:underline'
          />
        }
      >
        {customer.name}
      </HoverCardTrigger>
      <HoverCardContent className='w-72'>
        <div className='flex items-center gap-3'>
          <Avatar>
            <AvatarFallback>{customer.initials}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 leading-tight'>
            <div className='font-medium'>{customer.name}</div>
            <div className='truncate text-xs text-muted-foreground'>
              {customer.title}
            </div>
          </div>
        </div>
        <dl className='grid gap-2 pt-3 text-xs'>
          <div className='flex items-center gap-2'>
            <MailIcon className='size-3.5 text-muted-foreground' />
            <span className='truncate'>{customer.email}</span>
          </div>
          <div className='flex items-center gap-2'>
            <PhoneIcon className='size-3.5 text-muted-foreground' />
            <span>{customer.phone}</span>
          </div>
          <div className='flex items-center gap-2'>
            <BuildingIcon className='size-3.5 text-muted-foreground' />
            <span className='truncate'>{customer.company}</span>
          </div>
          <div className='flex items-center gap-2'>
            <CalendarIcon className='size-3.5 text-muted-foreground' />
            <span>
              {t('examples.customers.customerSince', {
                date: format(new Date(customer.since), 'PP'),
              })}
            </span>
          </div>
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}

interface CustomerMenuProps {
  readonly customer: Customer;
  readonly onOpenProfile: (customer: Customer) => void;
  readonly onCopyEmail: (customer: Customer) => void;
}

function CustomerMenu({
  customer,
  onOpenProfile,
  onCopyEmail,
}: CustomerMenuProps): ReactElement {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('reference.actions')}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {/* Base UI reads the label's group from context, so it cannot sit loose in the content. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('reference.actions')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onOpenProfile(customer)}>
            <UserRoundIcon />
            {t('examples.customers.openProfile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCopyEmail(customer)}>
            <CopyIcon />
            {t('examples.customers.copyEmail')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<a href={`mailto:${customer.email}`} />}>
            <MessageSquareIcon />
            {t('examples.customers.sendEmail')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
