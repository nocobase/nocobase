import { RightOutlined } from '@ant-design/icons';
import { Plugin, SettingsCenterProvider } from '@nocobase/client';
import { Button, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { lazy } from 'react';
import { useTranslation } from '../locale';

const DOCUMENTATION_PATH = '/api-documentation';
const Documentation = lazy(() => import('./Document'));

export const useStyles = createStyles(({ css, token }) => {
  return css`
    position: relative;
    background: ${token.colorBgContainer};
    padding: ${token.paddingMD}px;
    .open-tab {
      position: absolute;
      right: 0;
      top: 0;
    }
  `;
});

const SCDocumentation = () => {
  const { styles } = useStyles();
  return (
    <div className={styles}>
      <div className="open-tab">
        <Tooltip title="open in new tab">
          <a href={DOCUMENTATION_PATH} target="_blank" rel="noreferrer">
            <Button size="small" icon={<RightOutlined />} />
          </a>
        </Tooltip>
      </div>
      <Documentation />
    </div>
  );
};

const APIDocumentationProvider = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        ['api-doc']: {
          title: t('API documentation'),
          icon: 'BookOutlined',
          tabs: {
            documentation: {
              title: t('Documentation'),
              component: SCDocumentation,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
});
APIDocumentationProvider.displayName = 'APIDocumentationProvider';

export class APIDocumentationPlugin extends Plugin {
  async load() {
    this.app.use(APIDocumentationProvider);
    this.app.router.add('api-documentation', {
      path: DOCUMENTATION_PATH,
      Component: Documentation,
    });
  }
}

export default APIDocumentationPlugin;
