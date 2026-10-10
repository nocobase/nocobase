/**
 * Team settings — a settings area with four tabs: workspace profile, member
 * management, notification preferences and billing.
 *
 * Skeleton: `PageHeader` → `Breadcrumb` → banner `Alert` whose action jumps to
 * the billing tab → controlled `Tabs`. General: profile `Card` with avatar
 * row, slug `InputGroup`, `Textarea`, `NativeSelect`. Members: `AvatarGroup`
 * header and a `Table` with an inline role `Select` and remove. Notifications:
 * grouped `Switch` rows and a `Collapsible` advanced section. Billing: trial
 * `Alert`, plan `RadioGroup` cards, usage `Progress`, invoices `Table` →
 * invite `Dialog` → remove-member `AlertDialog`.
 *
 * Patterns, by the component or block that holds them:
 * - Banner with an action that changes tab: the `Alert` block and `setTab`.
 * - Controlled tabs: `TABS`, `tab`.
 * - Horizontal fields: `Field orientation='horizontal'` throughout General.
 * - Inline editing in a table row, owner exempt: the members `Table` and
 *   `changeRole`.
 * - Grouped preference switches from a map: `toEnabledMap` and the
 *   Notifications `FieldGroup`.
 * - Collapsible advanced section with a rotating chevron: the `Collapsible`.
 * - Plan picker as radio cards: the billing `RadioGroup`.
 * - Usage meters and an invoice table: the `Progress` and `Table` blocks.
 * - Invite dialog reading `FormData`; destructive confirm: `submitInvite`,
 *   `confirmRemove`.
 *
 * Demonstration filler to leave behind: `saveGeneral`, logo upload and invoice
 * download only toast; the trial and balance alerts are static copy; the
 * advanced `Collapsible` exists to show the primitive.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  DownloadIcon,
  MailIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UploadIcon,
  UserPlusIcon,
} from 'lucide-react';
import {
  type FormEvent,
  type ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from '@/components/ui/toast';
import { cn } from 'cn';

import { ExamplePage } from '../../shared';
import {
  ADVANCED_NOTIFICATIONS,
  CURRENT_PLAN,
  INVOICES,
  MEMBER_ROLES,
  NOTIFICATION_GROUPS,
  NOTIFICATION_ROWS,
  PLANS,
  STORAGE_USED,
  TEAM_MEMBERS,
  TIMEZONES,
  TRIAL_ENDS_AT,
  WORKSPACE_DESCRIPTION,
  WORKSPACE_NAME,
  WORKSPACE_SLUG,
  outstandingTotal,
  planById,
  seatsInUse,
  usagePercent,
  type InvoiceStatus,
  type MemberRole,
  type MemberStatus,
  type PlanId,
  type TeamMember,
} from './team-settings.data';

type SettingsTab = 'general' | 'members' | 'notifications' | 'billing';

const TABS: readonly SettingsTab[] = [
  'general',
  'members',
  'notifications',
  'billing',
];

const STATUS_BADGE: Record<
  MemberStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  active: 'default',
  invited: 'outline',
  suspended: 'destructive',
};

const INVOICE_BADGE: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  paid: 'secondary',
  pending: 'outline',
  failed: 'destructive',
};

function toEnabledMap(
  rows: readonly { readonly id: string; readonly enabled: boolean }[],
): Record<string, boolean> {
  return Object.fromEntries(rows.map((row) => [row.id, row.enabled]));
}

export default function TeamSettingsExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [name, setName] = useState(WORKSPACE_NAME);
  const [slug, setSlug] = useState(WORKSPACE_SLUG);
  const [about, setAbout] = useState(WORKSPACE_DESCRIPTION);
  const [timezone, setTimezone] = useState('Europe/Amsterdam');
  const [members, setMembers] = useState<readonly TeamMember[]>(TEAM_MEMBERS);
  const [inviting, setInviting] = useState(false);
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    () => toEnabledMap(NOTIFICATION_ROWS),
  );
  const [advanced, setAdvanced] = useState<Record<string, boolean>>(() =>
    toEnabledMap(ADVANCED_NOTIFICATIONS),
  );
  const [plan, setPlan] = useState<PlanId>(CURRENT_PLAN);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [i18n.language],
  );

  const roleLabel = useCallback(
    (role: MemberRole): string => t(`examples.teamSettings.role.${role}`),
    [t],
  );

  const selectedPlan = planById(plan);
  const seats = seatsInUse(members);
  const seatPercent = usagePercent(seats, selectedPlan.includedSeats);
  const storagePercent = usagePercent(
    STORAGE_USED,
    selectedPlan.includedStorage,
  );
  const outstanding = outstandingTotal(INVOICES);

  const saveGeneral = (): void => {
    toast.add({
      type: 'success',
      title: t('examples.teamSettings.general.saved'),
      description: t('examples.teamSettings.general.savedDescription', {
        name,
      }),
    });
  };

  const changeRole = (member: TeamMember, role: MemberRole): void => {
    setMembers((current) =>
      current.map((entry) =>
        entry.id === member.id ? { ...entry, role } : entry,
      ),
    );
    toast.add({
      type: 'success',
      title: t('examples.teamSettings.members.roleChanged'),
      description: t('examples.teamSettings.members.roleChangedDescription', {
        name: member.name,
        role: roleLabel(role),
      }),
    });
  };

  const confirmRemove = (): void => {
    if (!removing) return;
    const target = removing;
    setMembers((current) => current.filter((entry) => entry.id !== target.id));
    setRemoving(null);
    toast.add({
      type: 'success',
      title: t('examples.teamSettings.members.removed'),
      description: target.name,
    });
  };

  const submitInvite = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    if (typeof email !== 'string' || !email.includes('@')) return;
    const local = email.slice(0, email.indexOf('@'));
    const invited: TeamMember = {
      id: `usr_${members.length + 13}`,
      name: local,
      email,
      initials: local.slice(0, 2).toUpperCase(),
      role: inviteRole,
      status: 'invited',
      joinedAt: new Date().toISOString().slice(0, 10),
      lastActiveAt: new Date().toISOString().slice(0, 10),
    };
    setMembers((current) => [...current, invited]);
    setInviting(false);
    toast.add({
      type: 'success',
      title: t('examples.teamSettings.members.invited'),
      description: email,
    });
  };

  return (
    <ExamplePage
      title={t('examples.teamSettings.title')}
      description={t('examples.teamSettings.description')}
      actions={
        <>
          <Badge variant='secondary'>
            {t(`examples.teamSettings.plans.${selectedPlan.id}.name`)}
          </Badge>
          <Button onClick={() => setInviting(true)}>
            <UserPlusIcon data-icon='inline-start' />
            {t('examples.teamSettings.members.invite')}
          </Button>
        </>
      }
    >
      <Toaster />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>{t('reference.settings')}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t('examples.teamSettings.breadcrumb.workspace')}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t('examples.teamSettings.breadcrumb.team')}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Alert>
        <AlertTriangleIcon />
        <AlertTitle>{t('examples.teamSettings.notice.title')}</AlertTitle>
        <AlertDescription>
          {t('examples.teamSettings.notice.description', {
            amount: currency.format(outstanding),
          })}
        </AlertDescription>
        <AlertAction>
          <Button variant='outline' size='sm' onClick={() => setTab('billing')}>
            {t('examples.teamSettings.notice.action')}
          </Button>
        </AlertAction>
      </Alert>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as SettingsTab)}
        className='gap-5'
      >
        <TabsList variant='line'>
          {TABS.map((item) => (
            <TabsTrigger key={item} value={item}>
              {t(`examples.teamSettings.tabs.${item}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value='general' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('examples.teamSettings.general.title')}</CardTitle>
              <CardDescription>
                {t('examples.teamSettings.general.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation='horizontal' className='items-center'>
                  <Avatar size='lg'>
                    <AvatarFallback>NS</AvatarFallback>
                  </Avatar>
                  <FieldContent>
                    <FieldLabel htmlFor='team-logo'>
                      {t('examples.teamSettings.general.logo')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('examples.teamSettings.general.logoHint')}
                    </FieldDescription>
                  </FieldContent>
                  <Button
                    id='team-logo'
                    type='button'
                    variant='outline'
                    onClick={() =>
                      toast.add({
                        type: 'success',
                        title: t('examples.teamSettings.general.logoUploaded'),
                      })
                    }
                  >
                    <UploadIcon data-icon='inline-start' />
                    {t('reference.upload')}
                  </Button>
                </Field>

                <Separator />

                <Field>
                  <FieldLabel htmlFor='team-name'>
                    {t('examples.teamSettings.general.name')}
                  </FieldLabel>
                  <Input
                    id='team-name'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor='team-slug'>
                    {t('examples.teamSettings.general.slug')}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <span className='text-sm'>northwind.app/</span>
                    </InputGroupAddon>
                    <InputGroupInput
                      id='team-slug'
                      value={slug}
                      onChange={(event) => setSlug(event.target.value)}
                    />
                  </InputGroup>
                  <FieldDescription>
                    {t('examples.teamSettings.general.slugHint')}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor='team-about'>
                    {t('reference.description')}
                  </FieldLabel>
                  <Textarea
                    id='team-about'
                    rows={3}
                    value={about}
                    onChange={(event) => setAbout(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor='team-timezone'>
                    {t('examples.teamSettings.general.timezone')}
                  </FieldLabel>
                  <NativeSelect
                    id='team-timezone'
                    className='w-full max-w-xs'
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  >
                    {TIMEZONES.map((zone) => (
                      <NativeSelectOption key={zone.value} value={zone.value}>
                        {zone.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldDescription>
                    {t('examples.teamSettings.general.timezoneHint')}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <div className='flex justify-end'>
            <Button onClick={saveGeneral}>{t('reference.save')}</Button>
          </div>
        </TabsContent>

        <TabsContent value='members' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('examples.teamSettings.members.title')}</CardTitle>
              <CardDescription>
                {t('examples.teamSettings.members.description', {
                  count: members.length,
                })}
              </CardDescription>
              <div className='flex items-center gap-3 pt-2'>
                <AvatarGroup>
                  {members.slice(0, 4).map((entry) => (
                    <Avatar key={entry.id} size='sm'>
                      <AvatarFallback>{entry.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 4 ? (
                    <AvatarGroupCount>{`+${members.length - 4}`}</AvatarGroupCount>
                  ) : null}
                </AvatarGroup>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setInviting(true)}
                >
                  <UserPlusIcon data-icon='inline-start' />
                  {t('examples.teamSettings.members.invite')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reference.name')}</TableHead>
                    <TableHead>{t('reference.role')}</TableHead>
                    <TableHead>{t('reference.status')}</TableHead>
                    <TableHead>
                      {t('examples.teamSettings.members.joined')}
                    </TableHead>
                    <TableHead className='text-right'>
                      {t('reference.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar size='sm'>
                            <AvatarFallback>{entry.initials}</AvatarFallback>
                          </Avatar>
                          <div className='min-w-0 leading-tight'>
                            <div className='truncate font-medium'>
                              {entry.name}
                            </div>
                            <div className='truncate text-xs text-muted-foreground'>
                              {entry.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.role === 'owner' ? (
                          <span className='text-sm text-muted-foreground'>
                            {roleLabel('owner')}
                          </span>
                        ) : (
                          <Select
                            value={entry.role}
                            onValueChange={(value: string | null) =>
                              changeRole(
                                entry,
                                (value ?? entry.role) as MemberRole,
                              )
                            }
                          >
                            <SelectTrigger
                              size='sm'
                              className='w-32'
                              aria-label={t(
                                'examples.teamSettings.members.roleFor',
                                { name: entry.name },
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                              {MEMBER_ROLES.filter(
                                (role) => role !== 'owner',
                              ).map((role) => (
                                <SelectItem key={role} value={role}>
                                  {roleLabel(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[entry.status]}>
                          {t(
                            `examples.teamSettings.memberStatus.${entry.status}`,
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground tabular-nums'>
                        {format(new Date(entry.joinedAt), 'PP')}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          disabled={entry.role === 'owner'}
                          onClick={() => setRemoving(entry)}
                          aria-label={t(
                            'examples.teamSettings.members.removeMember',
                            { name: entry.name },
                          )}
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('examples.teamSettings.notifications.title')}
              </CardTitle>
              <CardDescription>
                {t('examples.teamSettings.notifications.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {NOTIFICATION_GROUPS.map((group, index) => (
                <div key={group} className='space-y-4'>
                  {index > 0 ? <Separator /> : null}
                  <h3 className='text-sm font-medium'>
                    {t(`examples.teamSettings.notificationGroups.${group}`)}
                  </h3>
                  <FieldGroup className='gap-4'>
                    {NOTIFICATION_ROWS.filter((row) => row.group === group).map(
                      (row) => (
                        <Field key={row.id} orientation='horizontal'>
                          <FieldContent>
                            <FieldLabel htmlFor={`notify-${row.id}`}>
                              {t(
                                `examples.teamSettings.notificationItems.${row.id}.label`,
                              )}
                            </FieldLabel>
                            <FieldDescription>
                              {t(
                                `examples.teamSettings.notificationItems.${row.id}.hint`,
                              )}
                            </FieldDescription>
                          </FieldContent>
                          <Switch
                            id={`notify-${row.id}`}
                            checked={notifications[row.id] ?? false}
                            onCheckedChange={(checked) =>
                              setNotifications((current) => ({
                                ...current,
                                [row.id]: checked,
                              }))
                            }
                          />
                        </Field>
                      ),
                    )}
                  </FieldGroup>
                </div>
              ))}

              <Separator />

              <Collapsible>
                <CollapsibleTrigger
                  render={<Button variant='ghost' size='sm' />}
                >
                  <SlidersHorizontalIcon data-icon='inline-start' />
                  {t('examples.teamSettings.notifications.advanced')}
                  <ChevronDownIcon
                    data-icon='inline-end'
                    className='transition-transform group-data-panel-open/button:rotate-180'
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FieldGroup className='gap-3 pt-4'>
                    {ADVANCED_NOTIFICATIONS.map((row) => (
                      <Field key={row.id} orientation='horizontal'>
                        <Checkbox
                          id={`advanced-${row.id}`}
                          checked={advanced[row.id] ?? false}
                          onCheckedChange={(checked) =>
                            setAdvanced((current) => ({
                              ...current,
                              [row.id]: checked,
                            }))
                          }
                        />
                        <FieldContent>
                          <FieldLabel htmlFor={`advanced-${row.id}`}>
                            {t(
                              `examples.teamSettings.advancedItems.${row.id}.label`,
                            )}
                          </FieldLabel>
                          <FieldDescription>
                            {t(
                              `examples.teamSettings.advancedItems.${row.id}.hint`,
                            )}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    ))}
                  </FieldGroup>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='billing' className='space-y-6'>
          <Alert>
            <MailIcon />
            <AlertTitle>
              {t('examples.teamSettings.billing.trialTitle')}
            </AlertTitle>
            <AlertDescription>
              {t('examples.teamSettings.billing.trialDescription', {
                date: format(new Date(TRIAL_ENDS_AT), 'PP'),
              })}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>{t('examples.teamSettings.billing.plan')}</CardTitle>
              <CardDescription>
                {t('examples.teamSettings.billing.planDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={plan}
                onValueChange={(value) => setPlan(value as PlanId)}
                className='grid gap-4 md:grid-cols-3'
              >
                {PLANS.map((option) => (
                  <label
                    key={option.id}
                    htmlFor={`plan-${option.id}`}
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-lg border border-border p-4 transition-colors',
                      option.id === plan
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem
                        id={`plan-${option.id}`}
                        value={option.id}
                      />
                      <span className='font-medium'>
                        {t(`examples.teamSettings.plans.${option.id}.name`)}
                      </span>
                    </div>
                    <div className='text-2xl font-semibold tabular-nums'>
                      {currency.format(option.pricePerSeat)}
                      <span className='ml-1 text-sm font-normal text-muted-foreground'>
                        {t('examples.teamSettings.billing.perSeat')}
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {t(`examples.teamSettings.plans.${option.id}.summary`, {
                        seats: option.includedSeats,
                        storage: option.includedStorage,
                      })}
                    </p>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('examples.teamSettings.billing.usage')}</CardTitle>
              <CardDescription>
                {t('examples.teamSettings.billing.usageDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6 sm:grid-cols-2'>
              <Progress value={seatPercent}>
                <ProgressLabel>
                  {t('examples.teamSettings.billing.seats', {
                    used: seats,
                    total: selectedPlan.includedSeats,
                  })}
                </ProgressLabel>
                <ProgressValue />
              </Progress>
              <Progress value={storagePercent}>
                <ProgressLabel>
                  {t('examples.teamSettings.billing.storage', {
                    used: STORAGE_USED,
                    total: selectedPlan.includedStorage,
                  })}
                </ProgressLabel>
                <ProgressValue />
              </Progress>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t('examples.teamSettings.billing.invoices')}
              </CardTitle>
              <CardDescription>
                {t('examples.teamSettings.billing.invoicesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('examples.teamSettings.billing.invoice')}
                    </TableHead>
                    <TableHead>
                      {t('examples.teamSettings.billing.period')}
                    </TableHead>
                    <TableHead>{t('reference.status')}</TableHead>
                    <TableHead className='text-right'>
                      {t('reference.amount')}
                    </TableHead>
                    <TableHead className='text-right'>
                      {t('reference.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVOICES.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className='font-mono text-xs'>
                        {invoice.number}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {invoice.period}
                      </TableCell>
                      <TableCell>
                        <Badge variant={INVOICE_BADGE[invoice.status]}>
                          {t(
                            `examples.teamSettings.invoiceStatus.${invoice.status}`,
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {currency.format(invoice.amount)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={t(
                            'examples.teamSettings.billing.downloadInvoice',
                            { number: invoice.number },
                          )}
                          onClick={() =>
                            toast.add({
                              type: 'success',
                              title: t('reference.download'),
                              description: invoice.number,
                            })
                          }
                        >
                          <DownloadIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className='sm:max-w-md'>
          <form onSubmit={submitInvite}>
            <DialogHeader>
              <DialogTitle>
                {t('examples.teamSettings.members.inviteTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('examples.teamSettings.members.inviteDescription')}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className='py-4'>
              <Field>
                <FieldLabel htmlFor='invite-email'>
                  {t('reference.email')}
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    id='invite-email'
                    name='email'
                    type='email'
                    required
                    placeholder='name@northwind.io'
                  />
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor='invite-role'>
                  {t('reference.role')}
                </FieldLabel>
                <Select
                  value={inviteRole}
                  onValueChange={(value: string | null) =>
                    setInviteRole((value ?? 'editor') as MemberRole)
                  }
                >
                  <SelectTrigger id='invite-role' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    {MEMBER_ROLES.filter((role) => role !== 'owner').map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabel(role)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {t(`examples.teamSettings.roleHint.${inviteRole}`)}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setInviting(false)}
              >
                {t('reference.cancel')}
              </Button>
              <Button type='submit'>
                {t('examples.teamSettings.members.sendInvite')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('examples.teamSettings.members.removeTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('examples.teamSettings.members.removeDescription', {
                name: removing?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('reference.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={confirmRemove}>
              {t('reference.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ExamplePage>
  );
}
