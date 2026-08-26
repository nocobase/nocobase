import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Tạo một đối tượng trạng thái phản ứng
const state = observable.deep({
  text: '',
});

// Bọc component bằng observer, tự động cập nhật khi trạng thái thay đổi
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Nhập gì đó..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Bạn đã nhập: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
