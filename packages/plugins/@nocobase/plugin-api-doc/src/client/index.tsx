import { RightOutlined } from '@ant-design/icons';
import { Plugin } from '@nocobase/client';
import { Button, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { lazy } from 'react';
import { NAMESPACE } from '../locale';

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
        <Tooltip title="Preview">
          <a href={DOCUMENTATION_PATH} target="_blank" rel="noreferrer">
            <Button size="small" icon={<RightOutlined />} />
          </a>
        </Tooltip>
      </div>
      <Documentation />
    </div>
  );
};

export class PluginAPIDocClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("API documentation", { ns: "${NAMESPACE}" })}}`,
      icon: 'BookOutlined',
      Component: SCDocumentation,
      aclSnippet: 'pm.api-doc.documentation',
    });

    this.app.router.add('api-documentation', {
      path: DOCUMENTATION_PATH,
      Component: Documentation,
    });
  }
}

export default PluginAPIDocClient;
