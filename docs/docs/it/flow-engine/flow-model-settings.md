:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# FlowModel: Flusso di Eventi e Configurazione

FlowModel offre un approccio basato sul «flusso di eventi (Flow)» per implementare la logica di configurazione dei componenti, rendendo il loro comportamento e la loro configurazione più estensibili e visibili.

## Modello Personalizzato

Può creare un modello di componente personalizzato estendendo `FlowModel`. Il modello deve implementare il metodo `render()` per definire la logica di rendering del componente.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Registrazione di un Flow (Flusso di Eventi)

Ogni modello può registrare uno o più **Flow**, utilizzati per descrivere la logica di configurazione e i passaggi di interazione del componente.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Impostazioni Pulsante',
  steps: {
    general: {
      title: 'Configurazione Generale',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Titolo Pulsante',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Descrizione

-   `key`: L'identificatore univoco del Flow.
-   `title`: Il nome del Flow, utilizzato per la visualizzazione nell'interfaccia utente.
-   `steps`: Definisce i passaggi di configurazione (Step). Ogni passaggio include:
    -   `title`: Il titolo del passaggio.
    -   `uiSchema`: La struttura del modulo di configurazione (compatibile con Formily Schema).
    -   `defaultParams`: Parametri predefiniti.
    -   `handler(ctx, params)`: Attivato al salvataggio, utilizzato per aggiornare lo stato del modello.

## Rendering del Modello

Quando si esegue il rendering di un modello di componente, può utilizzare il parametro `showFlowSettings` per controllare se abilitare la funzionalità di configurazione. Se `showFlowSettings` è abilitato, un punto di accesso alla configurazione (come un'icona delle impostazioni o un pulsante) apparirà automaticamente nell'angolo in alto a destra del componente.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Apertura Manuale del Modulo di Configurazione con openFlowSettings

Oltre ad aprire il modulo di configurazione tramite il punto di accesso interattivo integrato, può anche richiamare manualmente `openFlowSettings()` nel codice.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definizioni dei Parametri

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Obbligatorio, l'istanza del modello a cui appartiene
  preset?: boolean;               // Rende solo i passaggi contrassegnati come preset=true (predefinito false)
  flowKey?: string;               // Specifica un singolo Flow
  flowKeys?: string[];            // Specifica più Flow (ignorato se viene fornito anche flowKey)
  stepKey?: string;               // Specifica un singolo passaggio (solitamente usato con flowKey)
  uiMode?: 'dialog' | 'drawer';   // Il contenitore per la visualizzazione del modulo, predefinito 'dialog'
  onCancel?: () => void;          // Callback quando si clicca su annulla
  onSaved?: () => void;           // Callback dopo che la configurazione è stata salvata con successo
}
```

### Esempio: Apertura del Modulo di Configurazione di un Flow Specifico in Modalità Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Configurazione del pulsante salvata');
  },
});
```