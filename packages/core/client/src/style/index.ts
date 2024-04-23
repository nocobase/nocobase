import { CreateStylesUtils, createStyles } from 'antd-style';
import { CustomToken } from '../global-theme';
export * from './useToken';
export { createStyles };
export interface CustomCreateStylesUtils extends CreateStylesUtils {
  token: CustomToken;
}
