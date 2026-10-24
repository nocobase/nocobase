import { describe, expect, it } from 'vitest';
import {
  normalizeTemporalResultValue,
  normalizeTemporalValue,
} from '../../../src/repository/temporal.js';

describe('V1 temporal values', () => {
  const localDate = new Date(2026, 8, 6, 9, 30, 0, 120);

  it.each([
    ['date', '2024-02-29', '2024-02-29'],
    ['time', '09:30:00', '09:30:00.000'],
    ['time', '09:30:00.1', '09:30:00.100'],
    ['datetime', '2026-09-06T09:30:00', '2026-09-06T09:30:00.000'],
    ['date', localDate, '2026-09-06'],
    ['time', localDate, '09:30:00.120'],
    ['datetime', localDate, '2026-09-06T09:30:00.120'],
    ['datetimeTz', '2026-09-06T09:30:00+08:00', '2026-09-06T01:30:00.000Z'],
    ['datetimeTz', '2026-09-06T01:30:00Z', '2026-09-06T01:30:00.000Z'],
    [
      'datetimeTz',
      new Date('2026-09-06T01:30:00Z'),
      '2026-09-06T01:30:00.000Z',
    ],
  ])('normalizes %s temporal values', (type, input, expected) => {
    expect(
      normalizeTemporalValue({ name: 'value', type: String(type) }, input),
    ).toBe(expected);
  });

  it.each([
    ['date', '2026-02-29'],
    ['date', '2026-04-31'],
    ['date', '2026-00-01'],
    ['date', '0999-12-31'],
    ['time', '24:00:00'],
    ['time', '23:59:60'],
    ['time', '09:30:00Z'],
    ['time', '-01:00:00'],
    ['time', '09:30:00.0000'],
    ['date', new Date('invalid')],
    ['time', new Date('invalid')],
    ['datetime', new Date('invalid')],
    ['datetimeTz', '2026-09-06T09:30:00'],
    ['datetimeTz', new Date('invalid')],
    ['datetimeTz', '2026-09-06T09:30:00-00:00'],
    ['datetimeTz', '2026-09-06T09:30:00+14:01'],
    ['datetimeTz', '2026-09-06T09:30:00+01:60'],
    ['datetimeTz', '1000-01-01T00:00:00+01:00'],
    ['datetimeTz', '9999-12-31T23:59:59-01:00'],
    ['datetime', '2026-09-06T09:30:00-00:00'],
    ['datetime', '2026-09-06T09:30:00+14:01'],
    ['datetime', '2026-09-06T09:30:00+01:60'],
    ['date', '2026-09-06T09:30:00Z'],
  ])(
    'rejects invalid %s values rather than normalizing them silently',
    (type, input) => {
      expect(() =>
        normalizeTemporalValue({ name: 'value', type: String(type) }, input),
      ).toThrow(
        expect.objectContaining({ code: 'INVALID_MUTATION', field: 'value' }),
      );
    },
  );

  it('keeps nullability and caller error paths', () => {
    expect(
      normalizeTemporalValue({ name: 'day', type: 'date' }, null),
    ).toBeNull();
    expect(() =>
      normalizeTemporalValue(
        { name: 'day', type: 'date', nullable: false },
        null,
        'INVALID_FILTER',
        ['filter', 'value'],
      ),
    ).toThrow(
      expect.objectContaining({
        code: 'INVALID_FILTER',
        path: ['filter', 'value'],
      }),
    );
  });
});

describe('datetime values carrying a zone offset', () => {
  const field = { name: 'value', type: 'datetime' };

  /** The host's local reading of an instant, computed rather than written out so any TZ runs this suite. */
  function localDatetime(instant: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}T${pad(instant.getHours())}:${pad(instant.getMinutes())}:${pad(instant.getSeconds())}.${String(instant.getMilliseconds()).padStart(3, '0')}`;
  }

  it.each([
    '2026-09-06T09:30:00Z',
    '2026-09-06T09:30:00.120Z',
    '2026-09-06T09:30:00+08:00',
    '2026-09-06T09:30:00-05:30',
  ])('converts %s to the local wall clock instead of rejecting it', (input) => {
    expect(normalizeTemporalValue(field, input)).toBe(
      localDatetime(new Date(input)),
    );
  });

  it('agrees with the equivalent Date input', () => {
    const instant = new Date('2026-09-06T09:30:00.120Z');
    expect(normalizeTemporalValue(field, '2026-09-06T09:30:00.120Z')).toBe(
      normalizeTemporalValue(field, instant),
    );
  });

  it.each([
    ['datetime', '2026-09-06 09:30:00', '2026-09-06T09:30:00.000'],
    ['datetime', '2026-09-06 09:30:00.120', '2026-09-06T09:30:00.120'],
    ['datetimeTz', '2026-09-06 09:30:00Z', '2026-09-06T09:30:00.000Z'],
    ['datetimeTz', '2026-09-06 09:30:00.120+00:00', '2026-09-06T09:30:00.120Z'],
  ])(
    'accepts the SQL space separator, writing %s %s as %s',
    (type, input, expected) => {
      expect(normalizeTemporalValue({ name: 'value', type }, input)).toBe(
        expected,
      );
    },
  );

  it('leaves an offset-free value on the wall clock it already names', () => {
    expect(normalizeTemporalValue(field, '2026-09-06T09:30:00.120')).toBe(
      '2026-09-06T09:30:00.120',
    );
  });

  // Reading is not writing. A caller's offset is resolved against the host, because the caller is present and
  // an equivalent `Date` lands there too. Stored bytes are resolved against UTC: nobody is present, the same
  // database has to report the same value on every host, and MySQL's `datetime(3)` already pivots on UTC.
  it.each([
    ['2026-09-06T09:30:00.120Z', '2026-09-06T09:30:00.120'],
    ['2026-09-06T17:30:00.120+08:00', '2026-09-06T09:30:00.120'],
    ['2026-09-06T04:00:00.120-05:30', '2026-09-06T09:30:00.120'],
  ])(
    'reads the stored offset %s as the UTC wall clock %s',
    (stored, expected) => {
      expect(normalizeTemporalResultValue(field, stored)).toBe(expected);
    },
  );

  it('reads a stored datetimeTz that carries no offset as UTC', () => {
    // What a `datetime` column holds after the Field is widened, and what MySQL's `datetime(3)` always holds.
    expect(
      normalizeTemporalResultValue(
        { name: 'value', type: 'datetimeTz' },
        '2026-09-06T09:30:00.120',
      ),
    ).toBe('2026-09-06T09:30:00.120Z');
  });
});

describe('temporal result values', () => {
  it.each([
    ['1000-01-01 00:00:00', '1000-01-01T00:00:00.000'],
    ['2000-02-29T23:59:59.123456', '2000-02-29T23:59:59.123'],
    ['2024-02-29 01:02:03.1Z', '2024-02-29T01:02:03.100'],
    ['9999-12-31T23:59:59.999+00:00', '9999-12-31T23:59:59.999'],
  ])('reads an offset-free or UTC timestamp %s', (input, local) => {
    expect(
      normalizeTemporalResultValue({ name: 'value', type: 'datetime' }, input),
    ).toBe(local);
    expect(
      normalizeTemporalResultValue(
        { name: 'value', type: 'datetimeTz' },
        input,
      ),
    ).toBe(`${local}Z`);
  });

  it.each([
    '0999-12-31T23:59:59Z',
    '1900-02-29T00:00:00',
    '2100-02-29T00:00:00',
    '2026-04-31T00:00:00',
    '2026-00-01T00:00:00',
    '2026-13-01T00:00:00',
    '2026-01-00T00:00:00',
    '2026-01-32T00:00:00',
    '2026-01-01T24:00:00',
    '2026-01-01T00:60:00',
    '2026-01-01T00:00:60',
    '2026-01-01T00:00:00-00:00',
    '2026-01-01T00:00:00.1234567',
  ])('rejects invalid stored timestamps %s', (input) => {
    for (const type of ['datetime', 'datetimeTz']) {
      expect(() =>
        normalizeTemporalResultValue({ name: 'value', type }, input),
      ).toThrow(
        expect.objectContaining({
          code: 'FIELD_CAPABILITY_NOT_SUPPORTED',
          field: 'value',
        }),
      );
    }
  });

  // What knex stored on SQLite for `new Date('2026-09-20T12:52:16.452Z')` before temporal Fields were normalized:
  // the REAL `getTime()`, or the same number as text once a TEXT column applied its affinity.
  const epochMilliseconds = 1789908736452;
  const legacyText = '1789908736452.0';
  const instant = new Date(epochMilliseconds);

  it.each(['date', 'time', 'datetime', 'datetimeTz'])(
    'reads legacy epoch milliseconds as a %s exactly like a Date result',
    (type) => {
      const field = { name: 'value', type };
      const expected = normalizeTemporalResultValue(field, instant);

      expect(normalizeTemporalResultValue(field, epochMilliseconds)).toBe(
        expected,
      );
      expect(normalizeTemporalResultValue(field, legacyText)).toBe(expected);
    },
  );

  it('renders a legacy datetimeTz as the UTC instant it was', () => {
    expect(
      normalizeTemporalResultValue(
        { name: 'value', type: 'datetimeTz' },
        legacyText,
      ),
    ).toBe('2026-09-20T12:52:16.452Z');
  });

  it('still rejects numeric text that is not an epoch timestamp', () => {
    for (const input of ['20260920', '1789908736452.5', 12345, 'abc']) {
      expect(() =>
        normalizeTemporalResultValue(
          { name: 'value', type: 'datetime' },
          input,
        ),
      ).toThrow(
        expect.objectContaining({
          code: 'FIELD_CAPABILITY_NOT_SUPPORTED',
          field: 'value',
        }),
      );
    }
  });
});
