import type { FieldDefinition } from '../collection/types.js';
import { RepositoryError, type RepositoryErrorCode } from './errors.js';

export type TemporalType = 'date' | 'time' | 'datetime' | 'datetimeTz';

export function isTemporalType(type: string): type is TemporalType {
  return ['date', 'time', 'datetime', 'datetimeTz'].includes(type);
}

const offsetPattern = '(Z|[+-]\\d{2}:\\d{2})';
const storedTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})?$/;

/** Validate the calendar without allocating a Date for each stored cell. */
function validCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1)
    return false;
  const days =
    month === 2
      ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
        ? 29
        : 28
      : month === 4 || month === 6 || month === 9 || month === 11
        ? 30
        : 31;
  return day <= days;
}

/** `Z` and every real zone offset; `-00:00` is the one ISO 8601 spells but forbids. */
function isValidOffset(offset: string): boolean {
  if (offset === 'Z') return true;
  if (offset === '-00:00') return false;
  const hours = Number(offset.slice(1, 3));
  const minutes = Number(offset.slice(4));
  return !(hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0));
}

/**
 * Render an instant the way each logical type stores it.
 *
 * `datetimeTz` keeps the instant; the other three are wall-clock types, so they take the host's local reading of
 * it. This is the single definition of "local" that a `Date` input, an offset-bearing string, and a stored value
 * read back all go through, which is what keeps those three agreeing with each other.
 */
function renderTemporal(type: string, value: Date): string {
  if (type === 'datetimeTz') return value.toISOString();
  const pad = (part: number) => String(part).padStart(2, '0');
  const milliseconds = String(value.getMilliseconds()).padStart(3, '0');
  const day = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const clock = `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.${milliseconds}`;
  if (type === 'date') return day;
  if (type === 'time') return clock;
  return `${day}T${clock}`;
}

/** Validate before parsing; Date.parse alone silently normalizes invalid dates. */
export function normalizeTemporalValue(
  field: FieldDefinition,
  input: unknown,
  code: RepositoryErrorCode = 'INVALID_MUTATION',
  path: readonly (string | number)[] = ['values', field.name],
): string | null {
  const fail = (): never => {
    throw new RepositoryError(
      code,
      `Invalid ${field.type} value for Field "${field.name}". Expected a valid V1 temporal value with at most millisecond precision.`,
      { field: field.name, path },
    );
  };
  if (input === null) {
    if (field.nullable === false || field.primaryKey) return fail();
    return null;
  }
  let value = input;
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return fail();
    value = renderTemporal(field.type, value);
  }
  if (typeof value !== 'string') return fail();
  const datePattern = '(\\d{4})-(\\d{2})-(\\d{2})';
  const timePattern = '(\\d{2}):(\\d{2}):(\\d{2})(?:\\.(\\d{1,3}))?';
  if (field.type === 'time') {
    const time = value.match(new RegExp(`^${timePattern}$`));
    if (
      !time ||
      Number(time[1]) > 23 ||
      Number(time[2]) > 59 ||
      Number(time[3]) > 59
    )
      return fail();
    return `${time[1]}:${time[2]}:${time[3]}.${(time[4] ?? '').padEnd(3, '0')}`;
  }
  // `YYYY-MM-DD HH:mm:ss` is the literal every SQL dialect spells and the shape catalogs and drivers hand back,
  // so reading has always accepted it. Refusing it on the way in only made the two halves of one contract
  // disagree, and the error named the value rather than the separator. The space is unambiguous: no valid V1
  // value carries one, so it can only be standing in for the `T`.
  const text = field.type === 'date' ? value : value.replace(' ', 'T');
  // `datetime` is a wall-clock type, so an offset is not part of what it stores — but a caller holding an
  // instant has nowhere else to put one, and `new Date(...)` is already accepted and read locally. An offset
  // here is therefore converted rather than refused, and lands on exactly the value the equivalent `Date`
  // would have: `2026-09-06T09:30:00Z` stores 17:30 for a host at +08:00.
  const pattern =
    field.type === 'date'
      ? `^${datePattern}$`
      : `^${datePattern}T${timePattern}${offsetPattern}${field.type === 'datetime' ? '?' : ''}$`;
  const match = text.match(new RegExp(pattern));
  if (!match) return fail();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1000 ||
    year > 9999 ||
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  )
    return fail();
  if (field.type === 'date') return text;
  if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59)
    return fail();
  const local = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${(match[7] ?? '').padEnd(3, '0')}`;
  const offset = match[8];
  if (offset === undefined) return local;
  if (!isValidOffset(offset)) return fail();
  const instant = new Date(`${local}${offset}`);
  if (!Number.isFinite(instant.getTime())) return fail();
  // Range is checked on the value that is actually stored: the UTC instant for `datetimeTz`, the converted
  // local reading for `datetime`. Either can leave the representable years that the other stays inside.
  const storedYear =
    field.type === 'datetimeTz'
      ? instant.getUTCFullYear()
      : instant.getFullYear();
  if (storedYear < 1000 || storedYear > 9999) return fail();
  return renderTemporal(field.type, instant);
}

/**
 * Recognize epoch milliseconds left behind by the query builder before it knew about temporal Fields.
 *
 * It used to hand `Date` values straight to the driver, and knex stores a `Date` on SQLite as `getTime()`, so a
 * `datetime` column written through `database.query()` at the time holds `1789908736452` as a REAL, or the text
 * `"1789908736452.0"` once the column's TEXT affinity has had its way. Without this, the first read of such a row
 * fails with `FIELD_CAPABILITY_NOT_SUPPORTED` and an application that upgraded in place cannot even sign a user in.
 *
 * No valid V1 temporal string is a bare number, so the shape is unambiguous. Only values with at least twelve digits
 * qualify, which keeps a short numeric string on the ordinary validation path so it is still reported as invalid.
 * The value is read back as the instant it was and rendered exactly as a `Date` result would be.
 */
function legacyEpochMilliseconds(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) && Math.abs(input) >= 1e11
      ? input
      : undefined;
  }
  if (typeof input !== 'string') return undefined;
  const match = input.match(/^(-?\d{12,16})(?:\.0+)?$/);
  return match ? Number(match[1]) : undefined;
}

/**
 * Resolve stored timestamp text whose offset does not match the Field's logical type.
 *
 * Both shapes exist, and neither is something a caller can write today. A `datetimeTz` value carrying no offset
 * is what a `datetime` column holds after a Field is widened, and on MySQL it is what the column always holds,
 * since `datetime(3)` records no zone and the projection appends the `Z`. An offset inside a `datetime` value is
 * the mirror image: the row was narrowed from `datetimeTz`, or the query builder wrote it before it validated
 * strings and only SQLite could keep it.
 *
 * UTC is the pivot in both directions, for the same reason MySQL already uses it: it is the only reading that
 * does not depend on the host the row is read on, so the same database file reports the same value everywhere
 * and a Field converted one way and back returns what it started with. The host's zone belongs to the write
 * path, where a caller is present and `Date` semantics apply; it has no business deciding what stored bytes
 * already mean.
 */
function resolveStoredTimestamp(
  field: FieldDefinition,
  local: string,
  offset: string | undefined,
): string | null {
  const code: RepositoryErrorCode = 'FIELD_CAPABILITY_NOT_SUPPORTED';
  if (field.type === 'datetimeTz')
    return normalizeTemporalValue(field, `${local}${offset ?? 'Z'}`, code);
  if (offset === undefined) return normalizeTemporalValue(field, local, code);
  // Validate and range-check as the instant it names, then keep that instant's UTC wall clock.
  const resolved = normalizeTemporalValue(
    { ...field, type: 'datetimeTz' },
    `${local}${offset}`,
    code,
  );
  return resolved === null ? null : resolved.slice(0, 23);
}

/** Normalize driver-native temporal results to the portable string contract. */
export function normalizeTemporalResultValue(
  field: FieldDefinition,
  raw: unknown,
): string | null {
  if (raw === null) return null;
  const legacy = legacyEpochMilliseconds(raw);
  const input = legacy === undefined ? raw : new Date(legacy);
  if (input instanceof Date) {
    if (!Number.isFinite(input.getTime())) {
      throw new RepositoryError(
        'FIELD_CAPABILITY_NOT_SUPPORTED',
        `Invalid stored ${field.type} value for Field "${field.name}".`,
        { field: field.name, path: ['select', field.name] },
      );
    }
    return renderTemporal(field.type, input);
  }
  if (typeof input !== 'string') {
    throw new RepositoryError(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Invalid stored ${field.type} value for Field "${field.name}".`,
      { field: field.name, path: ['select', field.name] },
    );
  }
  if (field.type === 'datetime' || field.type === 'datetimeTz') {
    const stamp = storedTimestampPattern.exec(input);
    // The common driver result is an offset-free or UTC timestamp. Validate
    // it once and format directly; real offsets retain the conversion path.
    if (
      stamp &&
      (stamp[8] === undefined || stamp[8] === 'Z' || stamp[8] === '+00:00') &&
      validCalendarDate(Number(stamp[1]), Number(stamp[2]), Number(stamp[3])) &&
      Number(stamp[4]) < 24 &&
      Number(stamp[5]) < 60 &&
      Number(stamp[6]) < 60
    ) {
      const local = `${stamp[1]}-${stamp[2]}-${stamp[3]}T${stamp[4]}:${stamp[5]}:${stamp[6]}.${(stamp[7] ?? '').slice(0, 3).padEnd(3, '0')}`;
      return field.type === 'datetimeTz' ? `${local}Z` : local;
    }
  }
  if (field.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(input))
    return normalizeTemporalValue(
      field,
      input,
      'FIELD_CAPABILITY_NOT_SUPPORTED',
    );
  if (field.type === 'time') {
    const normalized = input.replace(
      /^(\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/,
      (_match, clock: string, fraction?: string) =>
        `${clock}.${(fraction ?? '').slice(0, 3).padEnd(3, '0')}`,
    );
    return normalizeTemporalValue(
      field,
      normalized,
      'FIELD_CAPABILITY_NOT_SUPPORTED',
    );
  }
  const normalized = input.replace(' ', 'T');
  // Catalogs report more fractional digits than V1 stores, so the stored text is truncated to milliseconds
  // before validation rather than being reported as invalid.
  const stamp = normalized.match(
    new RegExp(
      `^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2})(?:\\.(\\d{1,6}))?${offsetPattern}?$`,
    ),
  );
  if (stamp && (field.type === 'datetime' || field.type === 'datetimeTz'))
    return resolveStoredTimestamp(
      field,
      `${stamp[1]}.${(stamp[2] ?? '').slice(0, 3).padEnd(3, '0')}`,
      stamp[3],
    );
  return normalizeTemporalValue(
    field,
    normalized,
    'FIELD_CAPABILITY_NOT_SUPPORTED',
  );
}
