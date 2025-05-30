import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelComponent } from '@nocobase/flow-engine';
import moment from 'moment';
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const events = [
  {
    id: 0,
    title: '会议',
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000),
  },
  {
    id: 1,
    title: '演示',
    start: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
    end: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
  },
];

const localizer = momentLocalizer(moment);

class HelloFlowModel extends FlowModel {
  render() {
    return (
      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={this.props.events || []}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
        />
      </div>
    );
  }
}

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel });
    const model = this.flowEngine.createModel({
      use: 'HelloFlowModel',
      props: {
        events,
      },
    });
    this.router.add('root', { path: '/', element: <FlowModelComponent model={model} /> });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
