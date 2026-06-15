import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// 创建一个响应式状态对象
const state = observable.deep({
  text: '',
});

// 用 observer 包裹组件，状态变化时自动更新
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="输入点什么..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>你输入了：{state.text}</div>}
    </div>
  );
});

export default DemoPage;
