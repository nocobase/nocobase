import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Crear un objeto de estado reactivo
const state = observable.deep({
  text: '',
});

// Envolver el componente con observer; se actualizará al cambiar el estado
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Escriba algo..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Ha escrito: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
