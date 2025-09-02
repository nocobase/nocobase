import {
  Application,
  CardUpload,
  FieldModelRenderer,
  FormComponent,
  FormItem,
  Plugin,
  UploadFieldModel,
} from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <FormComponent
        model={this}
        layoutProps={{ layout: 'vertical' }}
        initialValues={{
          file: [
            {
              preview: 'https://minio.v2.test.nocobase.com/test/7ad6a3e3ea0ec2b0e2a3ef21542bf06d.png',
              url: 'https://minio.v2.test.nocobase.com/test/7ad6a3e3ea0ec2b0e2a3ef21542bf06d.png',
            },
          ],
          file1: [
            {
              url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
              preview: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
            },
          ],
        }}
      >
        <FormItem label="File" name="file">
          <FieldModelRenderer model={this.subModels.field} target="attachments" />
        </FormItem>
        <FormItem rules={[{ required: true }]} label="File1" name="file1">
          <CardUpload />
        </FormItem>
      </FormComponent>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel, UploadFieldModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        field: {
          use: 'UploadFieldModel',
        },
      },
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
