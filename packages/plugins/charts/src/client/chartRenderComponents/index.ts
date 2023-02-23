import { G2Plot } from '@nocobase/client';
import DataSetPreviewTable from '../DataSetPreviewTable';

const chartRenderComponentsMap = new Map();
chartRenderComponentsMap.set('G2Plot', G2Plot);
chartRenderComponentsMap.set('DataSetPreviewTable', DataSetPreviewTable);
export default chartRenderComponentsMap;
