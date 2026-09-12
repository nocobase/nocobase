import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// リアクティブな状態オブジェクトを作成
const state = observable.deep({
  text: '',
});

// observer でコンポーネントをラップすると、状態変化時に自動更新される
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="何か入力してください..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>入力内容：{state.text}</div>}
    </div>
  );
});

export default DemoPage;
