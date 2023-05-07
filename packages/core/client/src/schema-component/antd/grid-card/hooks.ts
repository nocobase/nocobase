import { SpaceProps } from 'antd';

const spaceProps: SpaceProps = {
  size: ['large', 'small'],
  wrap: true,
};

export const useGridCardActionBarProps = () => {
  return {
    spaceProps,
  };
};
