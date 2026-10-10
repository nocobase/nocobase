/**
 * Mock data for the Schedule example. Nothing here reaches a server.
 *
 * Days are stored as an offset from the Monday of the current week rather than
 * as fixed dates, so the calendar always has something to show. Titles, people
 * and locations are mock values and stay in English; everything the page states
 * in its own voice is a translation key it resolves.
 */

export type ScheduleCategory =
  'planning' | 'review' | 'customer' | 'focus' | 'social';

export interface ScheduleEvent {
  readonly id: string;
  readonly title: string;
  /** Days from the Monday of the current week; negative is the week before. */
  readonly dayOffset: number;
  /** Start of the event as `HH:mm` in the viewer's own time zone. */
  readonly start: string;
  readonly end: string;
  readonly attendees: readonly string[];
  readonly category: ScheduleCategory;
  readonly location: string;
}

export interface ScheduleMilestone {
  readonly id: string;
  readonly title: string;
  readonly dayOffset: number;
  readonly owner: string;
  readonly category: ScheduleCategory;
}

export const SCHEDULE_CATEGORIES: readonly ScheduleCategory[] = [
  'planning',
  'review',
  'customer',
  'focus',
  'social',
];

/** The first and last hour the agenda grid draws. */
export const AGENDA_START_HOUR = 8;
export const AGENDA_END_HOUR = 19;

export const SCHEDULE_ATTENDEES: readonly string[] = [
  'Ava Chen',
  'Liam Patel',
  'Noah Fischer',
  'Mia Rossi',
  'Ethan Novak',
  'Sofia Alvarez',
  'Lucas Meyer',
  'Emma Dubois',
  'Oliver Kim',
  'Isabella Costa',
];

export const SCHEDULE_EVENTS: readonly ScheduleEvent[] = [
  {
    id: 'evt_01',
    title: 'Sprint planning',
    dayOffset: 0,
    start: '09:00',
    end: '10:30',
    attendees: ['Ava Chen', 'Liam Patel', 'Noah Fischer'],
    category: 'planning',
    location: 'Room 3B',
  },
  {
    id: 'evt_02',
    title: 'Northwind onboarding call',
    dayOffset: 0,
    start: '11:00',
    end: '12:00',
    attendees: ['Mia Rossi', 'Sofia Alvarez'],
    category: 'customer',
    location: 'Video call',
  },
  {
    id: 'evt_03',
    title: 'Deep work: billing rewrite',
    dayOffset: 0,
    start: '14:00',
    end: '17:00',
    attendees: ['Noah Fischer'],
    category: 'focus',
    location: 'Quiet zone',
  },
  {
    id: 'evt_04',
    title: 'Design review: order detail',
    dayOffset: 1,
    start: '10:00',
    end: '11:00',
    attendees: ['Ava Chen', 'Emma Dubois'],
    category: 'review',
    location: 'Room 1A',
  },
  {
    id: 'evt_05',
    title: 'Fabrikam quarterly check-in',
    dayOffset: 1,
    start: '15:00',
    end: '16:00',
    attendees: ['Sofia Alvarez', 'Lucas Meyer'],
    category: 'customer',
    location: 'Video call',
  },
  {
    id: 'evt_06',
    title: 'Roadmap workshop',
    dayOffset: 2,
    start: '09:30',
    end: '12:00',
    attendees: ['Ava Chen', 'Liam Patel', 'Mia Rossi', 'Oliver Kim'],
    category: 'planning',
    location: 'Room 3B',
  },
  {
    id: 'evt_07',
    title: 'Code review rotation',
    dayOffset: 2,
    start: '13:30',
    end: '14:30',
    attendees: ['Noah Fischer', 'Ethan Novak'],
    category: 'review',
    location: 'Video call',
  },
  {
    id: 'evt_08',
    title: 'Team lunch',
    dayOffset: 2,
    start: '12:00',
    end: '13:00',
    attendees: ['Ava Chen', 'Liam Patel', 'Emma Dubois', 'Isabella Costa'],
    category: 'social',
    location: 'Canteen',
  },
  {
    id: 'evt_09',
    title: 'Contoso migration dry run',
    dayOffset: 3,
    start: '10:00',
    end: '12:00',
    attendees: ['Ethan Novak', 'Oliver Kim'],
    category: 'customer',
    location: 'Room 2C',
  },
  {
    id: 'evt_10',
    title: 'Deep work: reporting queries',
    dayOffset: 3,
    start: '14:00',
    end: '16:30',
    attendees: ['Isabella Costa'],
    category: 'focus',
    location: 'Quiet zone',
  },
  {
    id: 'evt_11',
    title: 'Release readiness review',
    dayOffset: 4,
    start: '11:00',
    end: '12:00',
    attendees: ['Ava Chen', 'Noah Fischer', 'Lucas Meyer'],
    category: 'review',
    location: 'Room 1A',
  },
  {
    id: 'evt_12',
    title: 'Retrospective',
    dayOffset: 4,
    start: '16:00',
    end: '17:00',
    attendees: ['Ava Chen', 'Liam Patel', 'Mia Rossi', 'Emma Dubois'],
    category: 'planning',
    location: 'Room 3B',
  },
  {
    id: 'evt_13',
    title: 'Friday demo and drinks',
    dayOffset: 4,
    start: '17:30',
    end: '18:30',
    attendees: ['Ava Chen', 'Oliver Kim', 'Isabella Costa'],
    category: 'social',
    location: 'Lounge',
  },
  {
    id: 'evt_14',
    title: 'Support escalation sync',
    dayOffset: -2,
    start: '09:00',
    end: '09:30',
    attendees: ['Sofia Alvarez', 'Ethan Novak'],
    category: 'review',
    location: 'Video call',
  },
  {
    id: 'evt_15',
    title: 'Tailspin renewal prep',
    dayOffset: 7,
    start: '10:00',
    end: '11:30',
    attendees: ['Lucas Meyer', 'Mia Rossi'],
    category: 'customer',
    location: 'Room 2C',
  },
  {
    id: 'evt_16',
    title: 'Architecture spike review',
    dayOffset: 8,
    start: '13:00',
    end: '14:30',
    attendees: ['Noah Fischer', 'Oliver Kim', 'Ava Chen'],
    category: 'review',
    location: 'Room 1A',
  },
];

export const SCHEDULE_MILESTONES: readonly ScheduleMilestone[] = [
  {
    id: 'ms_01',
    title: 'Billing rewrite feature freeze',
    dayOffset: 4,
    owner: 'Noah Fischer',
    category: 'focus',
  },
  {
    id: 'ms_02',
    title: 'Contoso migration go-live',
    dayOffset: 9,
    owner: 'Ethan Novak',
    category: 'customer',
  },
  {
    id: 'ms_03',
    title: 'Q4 roadmap sign-off',
    dayOffset: 12,
    owner: 'Ava Chen',
    category: 'planning',
  },
  {
    id: 'ms_04',
    title: 'Reporting beta opens',
    dayOffset: 18,
    owner: 'Isabella Costa',
    category: 'review',
  },
  {
    id: 'ms_05',
    title: 'Team offsite',
    dayOffset: 25,
    owner: 'Emma Dubois',
    category: 'social',
  },
];

/** Minutes since midnight for an `HH:mm` string; `0` when it cannot be read. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':');
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) {
    return 0;
  }
  return parsedHours * 60 + parsedMinutes;
}

export function eventHour(event: ScheduleEvent): number {
  return Math.floor(timeToMinutes(event.start) / 60);
}

export function eventDurationLabel(event: ScheduleEvent): string {
  const minutes = timeToMinutes(event.end) - timeToMinutes(event.start);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function sortByStart(
  events: readonly ScheduleEvent[],
): readonly ScheduleEvent[] {
  return [...events].sort(
    (left, right) => timeToMinutes(left.start) - timeToMinutes(right.start),
  );
}
