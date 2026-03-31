import { Card, theme } from 'antd';
import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';

const BlockHeader = ({ title, description }: { title?: string; description?: string }) => {
  const { token } = theme.useToken();

  if (!title && !description) {
    return null;
  }

  return (
    <div>
      {title && <span>{title}</span>}
      {description && (
        <div
          style={{
            marginTop: 4,
            color: token.colorTextDescription,
            fontSize: token.fontSizeSM,
            fontWeight: token.fontWeightStrong ? undefined : 400,
            whiteSpace: 'normal',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
};

export class BlockModel<T = any> extends FlowModel<T> {
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
  }

  renderComponent(): React.ReactNode {
    throw new Error('renderComponent method must be implemented in subclasses of BlockModel');
  }

  render() {
    return (
      <Card
        ref={this.context.ref as any}
        title={<BlockHeader title={this.title} description={this.props.description as string | undefined} />}
        style={{ width: '100%' }}
        styles={{
          header: { marginTop: 8 },
        }}
      >
        {this.renderComponent()}
      </Card>
    );
  }
}

BlockModel.registerFlow({
  key: 'cardSettings',
  title: 'Card settings',
  steps: {
    titleDescription: {
      title: 'Title & description',
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: 'Title',
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: 'Description',
        },
      },
      handler(ctx, params) {
        ctx.model.setTitle(params.title);
        ctx.model.setProps({
          description: params.description,
        });
      },
    },
  },
});
