import { toGmt } from '@nocobase/utils';
import moment from 'moment';
import { getContext } from '../context';

describe('context', () => {
  test('$system.now should be equal to the current time', () => {
    const now = toGmt(moment()) as string;
    const ctx = getContext();
    expect(ctx.$system.now.slice(0, -3)).toBe(now.slice(0, -3));
  });
});
