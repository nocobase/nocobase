import error from './error';
import info from './info';
import Demo from './notification';
import success from './success';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Demo, info, error, success, warning];

export default previewerDemo;
