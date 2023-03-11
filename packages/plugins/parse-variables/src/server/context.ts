import moment from 'moment';
import { toGmt } from '@nocobase/utils';

/**
 * 解析变量所需的上下文
 * @returns
 */
export const getContext = () => {
  return {
    $system: {
      now: toGmt(moment()) as string,
    },
  };
};
