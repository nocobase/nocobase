import info from './info';
import Default from './modal';
import withButton from './modalWithButton';
import success from './success';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, info, withButton, warning, success];

export default previewerDemo;
