import { G2Plot } from '@nocobase/client';
import DataSetPreviewTable from '../DataSetPreviewTable';
import { IndicatorKanban } from '../IndicatorKanban';

const chartRenderComponentsMap = new Map();
chartRenderComponentsMap.set('G2Plot', G2Plot);
chartRenderComponentsMap.set('DataSetPreviewTable', DataSetPreviewTable);
chartRenderComponentsMap.set('IndicatorKanban', IndicatorKanban);
export default chartRenderComponentsMap;
