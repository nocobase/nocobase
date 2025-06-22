/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';
import { Spin, Alert, Card } from 'antd';
import { FlowModel, FlowModelMeta, DefaultStructure } from '@nocobase/flow-engine';

interface LightComponentProps {
  loading?: boolean;
  error?: string;
  componentKey?: string;
  template?: string;
  title?: string;
}

interface LightModelStructure extends DefaultStructure {
  subModels?: {
    actions?: FlowModel[];
  };
}

export class LightModel extends FlowModel<LightModelStructure> {
  declare props: LightComponentProps;
  componentRef = React.createRef<HTMLDivElement>();
  private cleanup: Array<() => void> = [];

  onInit(options: any): void {
    super.onInit(options);
    this.componentRef = React.createRef<HTMLDivElement>();
  }

  private processTemplate(template: string): string {
    if (!template) return '';
    const props = this.getProps();
    // 替换模板中的变量 {props.xxx} 为实际值
    return template.replace(/\{props\.(\w+)\}/g, (match, propName) => {
      const value = (props as any)[propName];
      return value !== undefined ? String(value) : match;
    });
  }

  private renderTemplate(template: string): React.ReactNode {
    if (!template) return null;

    const processedTemplate = this.processTemplate(template);

    // 简单的HTML渲染（后续可以扩展为更复杂的模板引擎）
    return (
      <div
        dangerouslySetInnerHTML={{ __html: processedTemplate }}
        style={{
          minHeight: '60px',
          padding: '16px',
          border: '1px solid #e8e8e8',
          borderRadius: '6px',
          background: '#fff',
        }}
      />
    );
  }

  render() {
    const { loading, error, componentKey, template, title } = this.props;

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ff4d4f' }}>
          <div>Error: {error}</div>
        </div>
      );
    }

    return (
      <div
        ref={this.componentRef}
        id={`light-component-${componentKey || this.uid}`}
        className="light-component-container"
      >
        {template ? (
          this.renderTemplate(template)
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无模板内容</div>
        )}
      </div>
    );
  }
}
