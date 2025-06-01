/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { uid } from '@formily/shared';
import { PageModel } from '../../../flow/model';
import { getPages, FlowPageConfig } from '../../../flow/data';
import { useParams } from 'react-router-dom';
import { useStyles as usePageStyles } from '../page/Page.style';

const { Title, Paragraph } = Typography;

export interface FlowPageProps {
  title?: string;
  description?: string;
  modelUid?: string;
  tabs?: Array<{
    title: string;
    content?: string;
  }>;
}

export const FlowPage: React.FC<FlowPageProps> = (props) => {
  const { modelUid } = props;
  const { t } = useTranslation();
  const { hashId, componentCls } = usePageStyles();
  const params = useParams();
  const [flowPageConfig, setFlowPageConfig] = useState<FlowPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const actualModelUid = modelUid || params.name;

  useEffect(() => {
    const loadFlowPageConfig = async () => {
      if (actualModelUid) {
        setLoading(true);
        try {
          const configs = getPages({ uid: actualModelUid });
          const config = configs.length > 0 ? configs[0] : null;
          setFlowPageConfig(config);
        } catch (error) {
          console.error('Failed to load FlowPage config:', error);
          setFlowPageConfig(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadFlowPageConfig();
  }, [actualModelUid]);

  const model = useFlowModel<PageModel>(actualModelUid || uid(), 'PageModel', flowPageConfig?.stepParams);

  if (!actualModelUid) {
    return (
      <div className={`${componentCls} ${hashId}`}>
        <div className="nb-page-wrapper">
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Title level={4} type="danger">
                {t('Error')}
              </Title>
              <Paragraph>{t('No Flow Page ID provided')}</Paragraph>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${componentCls} ${hashId}`}>
        <div className="nb-page-wrapper">
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: '16px' }}>{t('Loading Flow Page...')}</Paragraph>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!flowPageConfig) {
    return (
      <div className={`${componentCls} ${hashId}`}>
        <div className="nb-page-wrapper">
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Title level={4} type="warning">
                {t('Not Found')}
              </Title>
              <Paragraph>{t('Flow Page configuration not found for ID: {{id}}', { id: actualModelUid })}</Paragraph>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`${componentCls} ${hashId}`}>
      <div className="nb-page-wrapper">
        <FlowModelRenderer model={model} />
      </div>
    </div>
  );
};

FlowPage.displayName = 'FlowPage';
