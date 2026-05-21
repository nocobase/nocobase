import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Crée un objet d'état réactif
const state = observable.deep({
  text: '',
});

// Enveloppez le composant avec observer pour qu'il se mette à jour automatiquement lors des changements d'état
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Saisissez quelque chose..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Vous avez saisi : {state.text}</div>}
    </div>
  );
});

export default DemoPage;
