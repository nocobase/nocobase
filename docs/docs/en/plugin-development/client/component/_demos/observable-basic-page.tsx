import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Create a reactive state object
const state = observable.deep({
  text: '',
});

// Wrap the component with observer so it auto-updates when state changes
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Type something..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>You typed: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
