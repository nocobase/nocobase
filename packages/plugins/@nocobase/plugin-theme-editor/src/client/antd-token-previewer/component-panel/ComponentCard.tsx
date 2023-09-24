import type { CardProps } from 'antd';
import { Card } from 'antd';
import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import React, { useState } from 'react';
import { Control } from '../icons';
import type { MutableTheme, TokenName } from '../interface';
import makeStyle from '../utils/makeStyle';
import ComponentTokenDrawer from './ComponentTokenDrawer';

const useStyle = makeStyle('ComponentCard', (token) => ({
  [`${token.rootCls}-card.component-card`]: {
    borderRadius: 6,
    boxShadow: `0 1px 2px 0 rgba(25,15,15,0.07)`,

    [`${token.rootCls}-card-head`]: {
      paddingInline: 18,

      [`${token.rootCls}-card-head-title`]: {
        paddingBlock: token.paddingSM,
        fontSize: token.fontSize,
      },
    },

    [`${token.rootCls}-card-body`]: {
      padding: 18,
      overflow: 'auto',
    },

    '.component-token-control-icon': {
      color: token.colorIcon,
      transition: `color ${token.motionDurationMid}`,
      fontSize: token.fontSizeLG,
      cursor: 'pointer',

      '&:hover': {
        color: token.colorIconHover,
      },
    },
  },
}));

export const getComponentDemoId = (component: string) => `antd-token-previewer-${component}`;

export type ComponentCardProps = PropsWithChildren<{
  title: CardProps['title'];
  component?: string;
  onTokenClick?: (token: TokenName) => void;
  drawer?: boolean;
  theme?: MutableTheme;
}>;

const ComponentCard: FC<ComponentCardProps> = ({ children, component, title, theme, drawer }) => {
  const [wrapSSR, hashId] = useStyle();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return wrapSSR(
    <>
      <Card
        className={classNames('component-card', hashId)}
        title={title}
        extra={
          drawer && theme && <Control className="component-token-control-icon" onClick={() => setDrawerOpen(true)} />
        }
      >
        {children}
      </Card>
      {drawer && theme && (
        <ComponentTokenDrawer
          visible={drawerOpen}
          theme={theme}
          component={component}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>,
  );
};

export default ComponentCard;
