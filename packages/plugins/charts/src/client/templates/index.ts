import { pieTemplate } from './PieTemplate';
import { barTemplate } from './BarTemplate';
import { columnTemplate } from './ColumnTemplate';
import { lineTemplate } from './LineTemplate';
import { areaTemplate } from './AreaTemplate';
import { tableTemplate } from './TableTemplate';

export const templates = new Map();

templates.set('Pie', pieTemplate);
templates.set('Line', lineTemplate);
templates.set('Area', areaTemplate);
templates.set('Bar', barTemplate);
templates.set('Column', columnTemplate);
// templates.set('DataSetPreviewTable', tableTemplate);
