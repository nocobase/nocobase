/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { createStyles } from 'antd-style';

const { Title, Paragraph } = Typography;

const useStyles = createStyles(({ token }) => ({
  flowPageContainer: {
    padding: token.padding,
    minHeight: '100vh',
    backgroundColor: token.colorBgContainer,
  },
  flowPageCard: {
    maxWidth: 800,
    margin: '0 auto',
    marginTop: token.marginLG,
  },
  flowPageHeader: {
    textAlign: 'center',
    marginBottom: token.marginLG,
  },
  flowPageContent: {
    textAlign: 'center',
    color: token.colorTextSecondary,
  },
}));

export interface FlowPageProps {
  title?: string;
  description?: string;
}

export const FlowPage: React.FC<FlowPageProps> = (props) => {
  const { title, description } = props;
  const { t } = useTranslation();
  const { styles } = useStyles();

  return (
    <div className={styles.flowPageContainer}>
      <Card className={styles.flowPageCard}>
        <div className={styles.flowPageHeader}>
          <Title level={2}>{title || t('Flow Page')}</Title>
        </div>
        <div className={styles.flowPageContent}>
          <Paragraph>
            {description ||
              t('This is a Flow Page component. You can customize it to display workflow-related content.')}
          </Paragraph>
          <Paragraph type="secondary">
            {t('Flow pages are designed to handle workflow processes and can be extended with custom functionality.')}
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

FlowPage.displayName = 'FlowPage';
