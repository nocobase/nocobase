import { getStrength } from '../utils';

describe('getStrength', () => {
  it('should return 0', () => {
    expect(getStrength('')).toBe(0);
  });

  it('should return 20', () => {
    expect(getStrength('123456')).toBe(20);
  });

  it('should return 40', () => {
    expect(getStrength('z123')).toBe(40);
  });

  it('should return 60', () => {
    expect(getStrength('z12345')).toBe(60);
  });

  it('should return 80', () => {
    expect(getStrength('z12345678')).toBe(80);
  });

  it('should return 100', () => {
    expect(getStrength('z1234567890')).toBe(100);
  });
});
