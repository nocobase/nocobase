import { theme } from 'antd';
import { CustomToken } from '../global-theme';

const { useToken: useAntdToken } = theme;

interface Result extends ReturnType<typeof useAntdToken> {
  token: CustomToken;
}

const useToken = () => {
  const result = useAntdToken();
  return result as Result;
};

export { useToken };
