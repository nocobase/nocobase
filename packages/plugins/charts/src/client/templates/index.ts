import { pieTemplate } from './PieTemplate';
import { barTemplate } from './BarTemplate';
import { columnTemplate } from './ColumnTemplate';

export const templates = new Map();

templates.set('Pie', pieTemplate);
templates.set('Bar', barTemplate);
templates.set('Column', columnTemplate);
