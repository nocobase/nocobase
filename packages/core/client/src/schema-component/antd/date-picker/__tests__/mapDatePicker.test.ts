import { vi } from 'vitest';
import dayjs from 'dayjs';
import { mapDatePicker } from '../util';

describe('mapDatePicker', () => {
  it('showTime is true and gmt is true', () => {
    const props = {
      value: '2022-02-22T22:22:22.000Z',
      showTime: true,
      gmt: true,
    };
    const result = mapDatePicker()(props);
    expect(result.value.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-02-22 22:22:22');
  });

  it('showTime is true and gmt is false', () => {
    const props = {
      value: '2022-02-22T22:22:22.000Z',
      showTime: true,
      gmt: false,
    };
    const result = mapDatePicker()(props);
    expect(result.value.format('YYYY-MM-DD HH:mm:ss')).toBe(
      dayjs('2022-02-22T22:22:22.000Z').format('YYYY-MM-DD HH:mm:ss'),
    );
  });

  it('showTime is false and gmt is true', () => {
    const props = {
      value: '2022-02-22T00:00:00.000Z',
      showTime: false,
      gmt: true,
    };
    const result = mapDatePicker()(props);
    expect(result.value.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-02-22 00:00:00');
  });

  it('showTime is false and gmt is false', () => {
    const props = {
      value: '2022-02-22',
      showTime: false,
      gmt: false,
    };
    const result = mapDatePicker()(props);
    expect(result.value.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-02-22 00:00:00');
  });

  it('should call onChange with correct value when showTime is true and gmt is true', () => {
    const props = {
      showTime: true,
      gmt: true,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs.utc('2022-02-22 22:22:22'));
    expect(props.onChange).toHaveBeenCalledWith('2022-02-22T22:22:22.000Z');
  });

  it('should call onChange with correct value when showTime is true and gmt is false', () => {
    const props = {
      showTime: true,
      gmt: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs('2022-02-22 22:22:22');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.toISOString());
  });

  it('should call onChange with correct value when showTime is false and gmt is true', () => {
    const props = {
      showTime: false,
      gmt: true,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs.utc('2022-02-22'));
    expect(props.onChange).toHaveBeenCalledWith('2022-02-22T00:00:00.000Z');
  });

  it('should call onChange with correct value when showTime is false and gmt is false', () => {
    const props = {
      showTime: false,
      gmt: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs('2022-02-22');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.toISOString());
  });

  it('should call onChange with correct value when picker is year and gmt is true', () => {
    const props = {
      picker: 'year',
      gmt: true,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs.utc('2022-01-01T00:00:00.000Z'));
    expect(props.onChange).toHaveBeenCalledWith('2022-01-01T00:00:00.000Z');
  });

  it('should call onChange with correct value when picker is year and gmt is false', () => {
    const props = {
      picker: 'year',
      gmt: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs('2022-02-01 00:00:00');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.startOf('year').toISOString());
  });

  it('should call onChange with correct value when picker is month and gmt is true', () => {
    const props = {
      picker: 'month',
      gmt: true,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs.utc('2022-02-22T00:00:00.000Z'));
    expect(props.onChange).toHaveBeenCalledWith('2022-02-01T00:00:00.000Z');
  });

  it('should call onChange with correct value when picker is month and gmt is false', () => {
    const props = {
      picker: 'month',
      gmt: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs('2022-02-01 00:00:00');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.startOf('month').toISOString());
  });

  it('should call onChange with correct value when picker is quarter and gmt is true', () => {
    const props = {
      picker: 'quarter',
      gmt: true,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs.utc('2022-02-22T00:00:00.000Z'));
    expect(props.onChange).toHaveBeenCalledWith('2022-01-01T00:00:00.000Z');
  });

  it('should call onChange with correct value when picker is quarter and gmt is false', () => {
    const props = {
      picker: 'quarter',
      gmt: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs('2022-02-01 00:00:00');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.startOf('quarter').toISOString());
  });

  it('should call onChange with correct value when picker is week and gmt is true', () => {
    const props = {
      picker: 'week',
      gmt: true,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs.utc('2022-02-21T00:00:00.000Z');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.startOf('week').add(1, 'day').toISOString());
  });

  it('should call onChange with correct value when picker is week and gmt is false', () => {
    const props = {
      picker: 'week',
      gmt: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    const m = dayjs('2022-02-21 00:00:00');
    result.onChange(m);
    expect(props.onChange).toHaveBeenCalledWith(m.startOf('week').add(1, 'day').toISOString());
  });

  it('should call onChange with correct value when utc is false', () => {
    const props = {
      showTime: true,
      gmt: true,
      utc: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs('2022-02-22 22:22:22'));
    expect(props.onChange).toHaveBeenCalledWith('2022-02-22 22:22:22');
  });

  it('should call onChange with correct value when picker is year and utc is false', () => {
    const props = {
      showTime: false,
      gmt: true,
      utc: false,
      onChange: vi.fn(),
    };
    const result = mapDatePicker()(props);
    result.onChange(dayjs('2022-01-01 23:00:00'));
    expect(props.onChange).toHaveBeenCalledWith('2022-01-01');
  });

  it('utc is false and gmt is true', () => {
    const props = {
      value: '2022-01-01 23:00:00',
      showTime: true,
      gmt: true,
      utc: false,
    };
    const result = mapDatePicker()(props);
    expect(result.value.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 23:00:00');
  });
});
