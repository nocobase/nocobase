/**
 * Team schedule — a calendar: a mini-month picker beside a day/week agenda
 * grid or a month list, a milestone carousel and a drawer that creates or
 * edits an event.
 *
 * Skeleton: `PageHeader` with a view `ToggleGroup`, prev/today/next
 * `ButtonGroup` and New event → two-column grid. Left: `Calendar` card with
 * the day's events, category legend card. Right: agenda card switching between
 * `AgendaSkeleton`, a month `Table` and an hour-by-day grid → milestone
 * `Carousel` → `Drawer` event form.
 *
 * Patterns, by the component or block that holds them:
 * - Mini calendar marking days with events: the `Calendar` and `eventDays`.
 * - Prev/today/next navigation: `shift` and the `ButtonGroup`.
 * - Event chip opening a `Popover`: `EventCard`.
 * - Category colors from chart tokens: `CATEGORY_CLASS`, `CATEGORY_DOT`.
 * - Hand-built time grid: the `AGENDA_HOURS` block.
 * - Loading skeleton: `AgendaSkeleton`.
 * - Multi-select chips combobox: the attendees `Combobox multiple` and
 *   `useComboboxAnchor`.
 * - One drawer form for create and edit: `openCreate`, `openEdit`,
 *   `saveEvent`.
 * - Locale-aware dates: `useLocale()` mapped to a `date-fns` locale and
 *   passed to every `format` call, `Calendar` and `DatePicker`.
 *
 * Demonstration filler to leave behind: the simulate-loading `Toggle`, the
 * `setTimeout` fake save, the milestone carousel and the `dayOffset` mock
 * dates that keep the data on "this week".
 */
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isSameDay,
  isSameMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import {
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  UsersIcon,
} from 'lucide-react';
import { Fragment, type ReactElement, useMemo, useState } from 'react';

import { DatePicker } from '@/components/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from 'cn';

import { ExamplePage } from '../../shared';
import {
  AGENDA_END_HOUR,
  AGENDA_START_HOUR,
  SCHEDULE_ATTENDEES,
  SCHEDULE_CATEGORIES,
  SCHEDULE_EVENTS,
  SCHEDULE_MILESTONES,
  eventDurationLabel,
  eventHour,
  sortByStart,
  type ScheduleCategory,
  type ScheduleEvent,
} from './schedule.data';

type ScheduleView = 'day' | 'week' | 'month';

const VIEWS: readonly ScheduleView[] = ['day', 'week', 'month'];

/** Monday of the current week; every stored day offset counts from here. */
const WEEK_ORIGIN = startOfWeek(startOfToday(), { weekStartsOn: 1 });

const AGENDA_HOURS: readonly number[] = Array.from(
  { length: AGENDA_END_HOUR - AGENDA_START_HOUR },
  (_, index) => AGENDA_START_HOUR + index,
);

/** Category tints, kept on the chart tokens so both themes stay legible. */
const CATEGORY_CLASS: Record<ScheduleCategory, string> = {
  planning: 'border-chart-1/30 bg-chart-1/15 text-chart-1',
  review: 'border-chart-2/30 bg-chart-2/15 text-chart-2',
  customer: 'border-chart-3/30 bg-chart-3/15 text-chart-3',
  focus: 'border-chart-4/30 bg-chart-4/15 text-chart-4',
  social: 'border-chart-5/30 bg-chart-5/15 text-chart-5',
};

const CATEGORY_DOT: Record<ScheduleCategory, string> = {
  planning: 'bg-chart-1',
  review: 'bg-chart-2',
  customer: 'bg-chart-3',
  focus: 'bg-chart-4',
  social: 'bg-chart-5',
};

interface EventDraft {
  readonly title: string;
  readonly date: Date | undefined;
  readonly start: string;
  readonly end: string;
  readonly attendees: readonly string[];
  readonly allDay: boolean;
  readonly notes: string;
}

function emptyDraft(date: Date): EventDraft {
  return {
    title: '',
    date,
    start: '09:00',
    end: '10:00',
    attendees: [],
    allDay: false,
    notes: '',
  };
}

function eventDate(event: ScheduleEvent): Date {
  return addDays(WEEK_ORIGIN, event.dayOffset);
}

function eventsOnDay(
  events: readonly ScheduleEvent[],
  day: Date,
): readonly ScheduleEvent[] {
  return sortByStart(
    events.filter((event) => isSameDay(eventDate(event), day)),
  );
}

interface EventCardProps {
  readonly event: ScheduleEvent;
  readonly onEdit: (event: ScheduleEvent) => void;
  readonly className?: string;
}

/** An event drawn in the agenda, opening its details in a popover. */
function EventCard({ event, onEdit, className }: EventCardProps): ReactElement {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type='button'
            className={cn(
              'w-full rounded-md border px-2 py-1 text-left text-xs leading-tight transition-opacity hover:opacity-80',
              CATEGORY_CLASS[event.category],
              className,
            )}
          />
        }
      >
        <span className='block truncate font-medium'>{event.title}</span>
        <span className='block truncate opacity-80 tabular-nums'>
          {event.start}–{event.end}
        </span>
      </PopoverTrigger>
      <PopoverContent className='w-72'>
        <PopoverHeader>
          <PopoverTitle>{event.title}</PopoverTitle>
          <PopoverDescription>
            {format(eventDate(event), 'PPPP')}
          </PopoverDescription>
        </PopoverHeader>
        <Badge variant='outline' className='w-fit'>
          <span
            className={cn('size-2 rounded-full', CATEGORY_DOT[event.category])}
            aria-hidden='true'
          />
          {t(`examples.schedule.category.${event.category}`)}
        </Badge>
        <Separator />
        <div className='space-y-1.5 text-xs text-muted-foreground'>
          <p className='flex items-center gap-1.5'>
            <ClockIcon className='size-3.5' aria-hidden='true' />
            <span className='tabular-nums'>
              {event.start}–{event.end}
            </span>
            <span>· {eventDurationLabel(event)}</span>
          </p>
          <p className='flex items-center gap-1.5'>
            <MapPinIcon className='size-3.5' aria-hidden='true' />
            {event.location}
          </p>
          <p className='flex items-start gap-1.5'>
            <UsersIcon className='mt-0.5 size-3.5' aria-hidden='true' />
            <span>{event.attendees.join(', ')}</span>
          </p>
        </div>
        <Button size='sm' variant='outline' onClick={() => onEdit(event)}>
          <PencilIcon data-icon='inline-start' />
          {t('reference.edit')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/** The placeholder shown while the "simulate loading" toggle is pressed. */
function AgendaSkeleton(): ReactElement {
  return (
    <div className='space-y-3 p-4'>
      {Array.from({ length: 6 }, (_, row) => (
        <div key={row} className='flex items-center gap-3'>
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-10 flex-1' />
          <Skeleton className='h-10 flex-1' />
          <Skeleton className='h-10 flex-1' />
        </div>
      ))}
    </div>
  );
}

export default function ScheduleExamplePage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dateLocale = locale.startsWith('zh') ? zhCN : enUS;

  const [events, setEvents] =
    useState<readonly ScheduleEvent[]>(SCHEDULE_EVENTS);
  const [view, setView] = useState<ScheduleView>('week');
  const [selected, setSelected] = useState<Date>(() => startOfToday());
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() =>
    emptyDraft(startOfToday()),
  );
  const [saving, setSaving] = useState(false);
  const attendeeAnchor = useComboboxAnchor();

  const days = useMemo(() => {
    if (view === 'day') return [selected];
    const start = startOfWeek(selected, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [view, selected]);

  const monthEvents = useMemo(
    () =>
      [...events]
        .filter((event) => isSameMonth(eventDate(event), selected))
        .sort(
          (left, right) =>
            eventDate(left).getTime() - eventDate(right).getTime() ||
            left.start.localeCompare(right.start),
        ),
    [events, selected],
  );

  const selectedDayEvents = useMemo(
    () => eventsOnDay(events, selected),
    [events, selected],
  );

  const eventDays = useMemo(() => events.map(eventDate), [events]);

  const rangeLabel = useMemo(() => {
    if (view === 'day') return format(selected, 'PPPP', { locale: dateLocale });
    if (view === 'month')
      return format(selected, 'LLLL yyyy', { locale: dateLocale });
    const start = startOfWeek(selected, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return `${format(start, 'PP', { locale: dateLocale })} – ${format(end, 'PP', { locale: dateLocale })}`;
  }, [view, selected, dateLocale]);

  const shift = (direction: -1 | 1): void => {
    setSelected((current) => {
      if (view === 'day') return addDays(current, direction);
      if (view === 'week') return addDays(current, direction * 7);
      return addMonths(current, direction);
    });
  };

  const openCreate = (): void => {
    setEditing(null);
    setDraft(emptyDraft(selected));
    setDrawerOpen(true);
  };

  const openEdit = (event: ScheduleEvent): void => {
    setEditing(event);
    setDraft({
      title: event.title,
      date: eventDate(event),
      start: event.start,
      end: event.end,
      attendees: [...event.attendees],
      allDay: false,
      notes: '',
    });
    setDrawerOpen(true);
  };

  const saveEvent = (): void => {
    const title = draft.title.trim();
    const day = draft.date;
    if (title.length === 0 || !day) return;
    setSaving(true);
    // Nothing calls a server here; the delay only shows the pending state.
    setTimeout(() => {
      const next: ScheduleEvent = {
        id: editing?.id ?? `evt_local_${events.length + 1}`,
        title,
        dayOffset: differenceInCalendarDays(day, WEEK_ORIGIN),
        start: draft.allDay ? '09:00' : draft.start,
        end: draft.allDay ? '18:00' : draft.end,
        attendees: [...draft.attendees],
        category: editing?.category ?? 'planning',
        location: editing?.location ?? 'Video call',
      };
      setEvents((current) =>
        editing
          ? current.map((event) => (event.id === editing.id ? next : event))
          : [...current, next],
      );
      setSaving(false);
      setDrawerOpen(false);
      setEditing(null);
      toast.add({
        type: 'success',
        title: editing
          ? t('examples.schedule.eventUpdated')
          : t('examples.schedule.eventCreated'),
        description: `${title} · ${format(day, 'PP', { locale: dateLocale })}`,
      });
    }, 600);
  };

  return (
    <ExamplePage
      title={t('examples.schedule.title')}
      description={t('examples.schedule.description')}
      actions={
        <>
          <ToggleGroup
            spacing={0}
            size='sm'
            variant='outline'
            value={[view]}
            onValueChange={(value: string[]) => {
              const next = value[0];
              if (next) setView(next as ScheduleView);
            }}
          >
            {VIEWS.map((entry) => (
              <ToggleGroupItem key={entry} value={entry}>
                {t(`examples.schedule.view.${entry}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ButtonGroup>
            <Button
              variant='outline'
              size='sm'
              aria-label={t('reference.previous')}
              onClick={() => shift(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelected(startOfToday())}
            >
              {t('reference.today')}
            </Button>
            <Button
              variant='outline'
              size='sm'
              aria-label={t('reference.next')}
              onClick={() => shift(1)}
            >
              <ChevronRightIcon />
            </Button>
          </ButtonGroup>
          <Button onClick={openCreate}>
            <CalendarPlusIcon data-icon='inline-start' />
            {t('examples.schedule.newEvent')}
          </Button>
        </>
      }
    >
      <Toaster />

      <div className='grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]'>
        <div className='space-y-4'>
          <Card className='gap-0 py-0'>
            <CardContent className='flex justify-center p-2'>
              <Calendar
                mode='single'
                locale={dateLocale}
                selected={selected}
                month={selected}
                onMonthChange={setSelected}
                onSelect={(date) => {
                  if (date) setSelected(date);
                }}
                modifiers={{ scheduled: eventDays }}
                modifiersClassNames={{ scheduled: 'font-semibold underline' }}
              />
            </CardContent>
            <Separator />
            <CardHeader className='py-3'>
              <CardTitle className='text-sm'>
                {format(selected, 'PPPP', { locale: dateLocale })}
              </CardTitle>
              <CardDescription>
                {t('examples.schedule.eventCount', {
                  count: selectedDayEvents.length,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2 pb-4'>
              {selectedDayEvents.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('examples.schedule.dayEmpty')}
                </p>
              ) : (
                selectedDayEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={openEdit} />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>
                {t('examples.schedule.legend')}
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-wrap gap-3 text-xs'>
              {SCHEDULE_CATEGORIES.map((category) => (
                <span key={category} className='flex items-center gap-1.5'>
                  <span
                    className={cn(
                      'size-2.5 rounded-full',
                      CATEGORY_DOT[category],
                    )}
                    aria-hidden='true'
                  />
                  {t(`examples.schedule.category.${category}`)}
                </span>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className='gap-0 py-0'>
          <CardHeader className='flex-row items-center justify-between gap-3 py-3'>
            <div>
              <CardTitle className='text-sm'>{rangeLabel}</CardTitle>
              <CardDescription>
                {t(`examples.schedule.view.${view}`)}
              </CardDescription>
            </div>
            <Toggle
              variant='outline'
              size='sm'
              pressed={loading}
              onPressedChange={setLoading}
            >
              {t('examples.schedule.simulateLoading')}
            </Toggle>
          </CardHeader>
          <Separator />
          <CardContent className='p-0'>
            {loading ? (
              <AgendaSkeleton />
            ) : view === 'month' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reference.date')}</TableHead>
                    <TableHead>{t('reference.time')}</TableHead>
                    <TableHead>{t('reference.title')}</TableHead>
                    <TableHead>{t('examples.schedule.attendees')}</TableHead>
                    <TableHead>{t('reference.category')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthEvents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='py-8 text-center text-muted-foreground'
                      >
                        {t('examples.schedule.monthEmpty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className='whitespace-nowrap'>
                          {format(eventDate(event), 'PP', {
                            locale: dateLocale,
                          })}
                        </TableCell>
                        <TableCell className='whitespace-nowrap tabular-nums'>
                          {event.start}–{event.end}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {event.title}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {event.attendees.join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={CATEGORY_CLASS[event.category]}
                          >
                            {t(`examples.schedule.category.${event.category}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <div className='overflow-x-auto'>
                <div
                  className='min-w-[36rem]'
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className='border-b bg-muted/40' />
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'border-b border-l bg-muted/40 px-2 py-2 text-center text-xs',
                        isSameDay(day, startOfToday()) &&
                          'font-semibold text-foreground',
                      )}
                    >
                      <div>{format(day, 'EEE', { locale: dateLocale })}</div>
                      <div className='text-muted-foreground tabular-nums'>
                        {format(day, 'd MMM', { locale: dateLocale })}
                      </div>
                    </div>
                  ))}

                  {AGENDA_HOURS.map((hour) => (
                    <Fragment key={hour}>
                      <div className='border-b px-2 py-1 text-right text-xs text-muted-foreground tabular-nums'>
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      {days.map((day) => {
                        const slotEvents = eventsOnDay(events, day).filter(
                          (event) => eventHour(event) === hour,
                        );
                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className='min-h-12 space-y-1 border-b border-l p-1'
                          >
                            {slotEvents.map((event) => (
                              <EventCard
                                key={event.id}
                                event={event}
                                onEdit={openEdit}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className='space-y-3'>
        <div className='space-y-1'>
          <h2 className='font-heading text-base font-semibold tracking-tight'>
            {t('examples.schedule.milestones')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('examples.schedule.milestonesDescription')}
          </p>
        </div>
        {/* The arrows sit at -left-12 and -right-12, outside the carousel root,
            so the room for them belongs to this wrapper; padding on the root
            itself indents the cards and leaves the arrows clipped. */}
        <div className='px-12'>
          <Carousel opts={{ align: 'start' }} className='w-full'>
            <CarouselContent className='-ml-3'>
              {SCHEDULE_MILESTONES.map((milestone) => (
                <CarouselItem
                  key={milestone.id}
                  className='basis-full pl-3 sm:basis-1/2 lg:basis-1/3'
                >
                  <Card size='sm' className='m-px h-full'>
                    <CardHeader>
                      <CardDescription className='tabular-nums'>
                        {format(
                          addDays(WEEK_ORIGIN, milestone.dayOffset),
                          'PP',
                          {
                            locale: dateLocale,
                          },
                        )}
                      </CardDescription>
                      <CardTitle className='text-sm'>
                        {milestone.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='flex items-center justify-between gap-2'>
                      <span className='text-xs text-muted-foreground'>
                        {t('examples.schedule.milestoneOwner', {
                          name: milestone.owner,
                        })}
                      </span>
                      <Badge
                        variant='outline'
                        className={CATEGORY_CLASS[milestone.category]}
                      >
                        {t(`examples.schedule.category.${milestone.category}`)}
                      </Badge>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label={t('reference.previous')} />
            <CarouselNext aria-label={t('reference.next')} />
          </Carousel>
        </div>
      </section>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editing
                ? t('examples.schedule.editEvent')
                : t('examples.schedule.newEvent')}
            </DrawerTitle>
            <DrawerDescription>
              {t('examples.schedule.drawerDescription')}
            </DrawerDescription>
          </DrawerHeader>
          <div className='mx-auto w-full max-w-md overflow-y-auto p-4'>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='schedule-title'>
                  {t('reference.title')}
                </FieldLabel>
                <Input
                  id='schedule-title'
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={t('examples.schedule.titlePlaceholder')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='schedule-date'>
                  {t('reference.date')}
                </FieldLabel>
                <DatePicker
                  id='schedule-date'
                  className='w-full'
                  locale={dateLocale}
                  value={draft.date}
                  onChange={(date) =>
                    setDraft((current) => ({ ...current, date }))
                  }
                />
              </Field>
              <Field orientation='horizontal'>
                <FieldLabel htmlFor='schedule-all-day'>
                  {t('examples.schedule.allDay')}
                </FieldLabel>
                <Switch
                  id='schedule-all-day'
                  checked={draft.allDay}
                  onCheckedChange={(checked) =>
                    setDraft((current) => ({ ...current, allDay: checked }))
                  }
                />
              </Field>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='schedule-start'>
                    {t('examples.schedule.startsAt')}
                  </FieldLabel>
                  <Input
                    id='schedule-start'
                    type='time'
                    disabled={draft.allDay}
                    value={draft.start}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        start: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='schedule-end'>
                    {t('examples.schedule.endsAt')}
                  </FieldLabel>
                  <Input
                    id='schedule-end'
                    type='time'
                    disabled={draft.allDay}
                    value={draft.end}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        end: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>{t('examples.schedule.attendees')}</FieldLabel>
                <Combobox
                  multiple
                  autoHighlight
                  items={SCHEDULE_ATTENDEES}
                  value={[...draft.attendees]}
                  onValueChange={(value: string[]) =>
                    setDraft((current) => ({ ...current, attendees: value }))
                  }
                >
                  <ComboboxChips ref={attendeeAnchor}>
                    <ComboboxValue>
                      {draft.attendees.map((name) => (
                        <ComboboxChip key={name}>{name}</ComboboxChip>
                      ))}
                    </ComboboxValue>
                    <ComboboxChipsInput
                      placeholder={t('examples.schedule.attendeesPlaceholder')}
                    />
                  </ComboboxChips>
                  <ComboboxContent anchor={attendeeAnchor}>
                    <ComboboxEmpty>
                      {t('examples.schedule.noAttendees')}
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(name: string) => (
                        <ComboboxItem key={name} value={name}>
                          {name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldDescription>
                  {t('examples.schedule.attendeeCount', {
                    count: draft.attendees.length,
                  })}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor='schedule-notes'>
                  {t('reference.notes')}
                </FieldLabel>
                <Textarea
                  id='schedule-notes'
                  rows={3}
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder={t('examples.schedule.notesPlaceholder')}
                />
              </Field>
            </FieldGroup>
          </div>
          <DrawerFooter className='mx-auto w-full max-w-md'>
            <Button
              onClick={saveEvent}
              disabled={saving || draft.title.trim().length === 0}
            >
              {saving ? t('reference.loading') : t('reference.save')}
            </Button>
            <Button variant='outline' onClick={() => setDrawerOpen(false)}>
              {t('reference.cancel')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </ExamplePage>
  );
}
