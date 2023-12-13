import { percent2float } from '../utils';

describe('percent2float', () => {
  it('should be NaN', () => {
    expect(percent2float('123')).toBe(NaN);
    expect(percent2float('3a')).toBe(NaN);
    expect(percent2float('3a%')).toBe(NaN);
  });

  it('should be a floating point number', () => {
    expect(percent2float('123%')).toBe(1.23);
    expect(percent2float('22.5507%')).toBe(0.225507); // not 0.22550699999999999
  });
});
