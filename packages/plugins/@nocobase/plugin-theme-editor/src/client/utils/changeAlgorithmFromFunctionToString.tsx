import { theme as antdTheme } from 'antd';
import _ from 'lodash';
import { ThemeConfig } from '../../types';

export function changeAlgorithmFromFunctionToString(themeConfig: any) {
  themeConfig = _.cloneDeep(themeConfig);

  if (!themeConfig.algorithm) {
    return themeConfig;
  }
  if (Array.isArray(themeConfig.algorithm)) {
    themeConfig.algorithm = themeConfig.algorithm.map((algorithm) => parseAlgorithm(algorithm)).filter(Boolean);
  } else {
    themeConfig.algorithm = parseAlgorithm(themeConfig.algorithm);
  }
  if (_.isEmpty(themeConfig.algorithm)) {
    delete themeConfig.algorithm;
  }
  return themeConfig;
}

function parseAlgorithm(algorithm: ThemeConfig['algorithm']): string {
  if (typeof algorithm === 'string') {
    return algorithm;
  }
  if (algorithm.toString() === antdTheme.darkAlgorithm.toString()) {
    return 'darkAlgorithm';
  }
  if (algorithm.toString() === antdTheme.compactAlgorithm.toString()) {
    return 'compactAlgorithm';
  }
}
