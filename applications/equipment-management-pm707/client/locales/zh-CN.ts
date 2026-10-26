import equipment from './equipment-zh-CN.js';
import type { AppResource } from './en-US.js';

import systemZhCN from './system/zh-CN.js';

const zhCN: AppResource = {
  // The template's own copy; see `./en-US.ts`.
  ...systemZhCN,
  equipment,
};

export default zhCN;
