import { pieTemplate } from './PieTemplate';
import { barTemplate } from './BarTemplate';
import { columnTemplate } from './ColumnTemplate';
import { lineTemplate } from './LineTemplate';
import { areaTemplate } from './AreaTemplate';
import { tableTemplate } from './TableTemplate';
import { scatterTemplate } from './ScatterTemplate';
import { radarTemplate } from './RadarTemplate';
import { funnelTemplate } from './FunnelTemplate';

export const templates = new Map();

templates.set('Pie', pieTemplate);
templates.set('Line', lineTemplate);
templates.set('Area', areaTemplate);
templates.set('Bar', barTemplate);
templates.set('Column', columnTemplate);
templates.set('Scatter', scatterTemplate);
templates.set('Radar', radarTemplate);
templates.set('Funnel', funnelTemplate);
// templates.set('DataSetPreviewTable', tableTemplate);
