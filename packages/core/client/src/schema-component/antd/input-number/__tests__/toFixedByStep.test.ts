import { toFixedByStep } from '../ReadPretty';

describe('toFixedByStep', () => {
  it('less than precision', () => {
    expect(toFixedByStep('1.1', '1.00')).toEqual('1.10');
    expect(toFixedByStep('1.23', '1.00000')).toEqual('1.23000');
  });

  it('large than precision', () => {
    expect(toFixedByStep('1.234', '1.00')).toEqual('1.23');
    expect(toFixedByStep('1.235', '1.00')).toEqual('1.24');
    expect(toFixedByStep('1.238', '1.00')).toEqual('1.24');
    expect(toFixedByStep('1.15', '1.0')).toEqual('1.2');
    expect(toFixedByStep('0.15', '1.0')).toEqual('0.2');

    // Integer
    expect(toFixedByStep('1.238', 1)).toEqual('1');
    expect(toFixedByStep('1.5', 1)).toEqual('2');
  });

  it('should return "" when input is ""/null/undefined', () => {
    expect(toFixedByStep('', '1.00')).toEqual('');
    expect(toFixedByStep(null, '1.00')).toEqual('');
    expect(toFixedByStep(undefined, '1.00')).toEqual('');
  });

  it('negative', () => {
    expect(toFixedByStep('-77.88', '1.0')).toEqual('-77.9');
  });
});
