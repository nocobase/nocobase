import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <Card {...this.props}>
        <div ref={this.context.ref} />
      </Card>
    );
  }
  async onMount() {
    if (!this.context.ref.current) {
      return;
    }
  }
}

HelloModel.registerFlow({
  key: 'codemirror',
  auto: true,
  steps: {
    init: {
      async handler(ctx, params) {
        ctx.onRefReady(ctx.ref, async (element) => {
          await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css');
          await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/monokai.min.css');

          ctx.requirejs.config({
            paths: {
              'codemirror/lib/codemirror': 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min',
              'codemirror/mode/htmlmixed/htmlmixed':
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/htmlmixed/htmlmixed.min',
              'codemirror/mode/xml/xml': 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/xml/xml.min',
              'codemirror/mode/javascript/javascript':
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min',
              'codemirror/mode/css/css': 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/css/css.min',
            },
          });

          ctx.requirejs(
            [
              'codemirror/lib/codemirror',
              'codemirror/mode/htmlmixed/htmlmixed',
              'codemirror/mode/xml/xml',
              'codemirror/mode/javascript/javascript',
              'codemirror/mode/css/css',
            ],
            (CodeMirror) => {
              CodeMirror(element, {
                value: `<!DOCTYPE html>
<html>
  <head>
    <title>Hello World</title>
  </head>
  <body>
    <h1>Hello, CodeMirror!</h1>
  </body>
</html>`,
                mode: 'htmlmixed',
                lineNumbers: true,
                theme: 'default',
                tabSize: 2,
              });
            },
          );
        });
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel });
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
