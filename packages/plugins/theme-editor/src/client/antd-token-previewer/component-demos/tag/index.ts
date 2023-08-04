import closable from './closable';
import error from './error';
import info from './info';
import multiTags from './multiTags';
import success from './success';
import Default from './tag';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, error, info, success, warning, multiTags, closable];

export default previewerDemo;
