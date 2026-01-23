:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Rendering di FlowModel

`FlowModelRenderer` è il componente React principale per il rendering di un'istanza di `FlowModel`. È responsabile della conversione di un'istanza di `FlowModel` in un componente React visuale.

## Utilizzo di Base

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Utilizzo di base
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Per i Model di campo controllati, utilizzi `FieldModelRenderer` per il rendering:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Rendering di campo controllato
<FieldModelRenderer model={fieldModel} />
```

## Props

### FlowModelRendererProps

| Parametro | Tipo | Predefinito | Descrizione |
|------|------|--------|------|
| `model` | `FlowModel` | - | L'istanza di FlowModel da renderizzare |
| `uid` | `string` | - | L'identificatore unico per il modello di flusso |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Contenuto di fallback da mostrare in caso di errore di rendering |
| `showFlowSettings` | `boolean \| object` | `false` | Indica se mostrare l'accesso alle impostazioni del flusso |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Lo stile di interazione per le impostazioni del flusso |
| `hideRemoveInSettings` | `boolean` | `false` | Indica se nascondere il pulsante di rimozione nelle impostazioni |
| `showTitle` | `boolean` | `false` | Indica se visualizzare il titolo del modello nell'angolo in alto a sinistra del bordo |
| `skipApplyAutoFlows` | `boolean` | `false` | Indica se saltare l'applicazione dei flussi automatici |
| `inputArgs` | `Record<string, any>` | - | Contesto aggiuntivo passato a `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Indica se avvolgere il livello più esterno con il componente `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Livello del menu delle impostazioni: 1=solo modello corrente, 2=include modelli figli |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Elementi aggiuntivi della barra degli strumenti |

### Configurazione Dettagliata di `showFlowSettings`

Quando `showFlowSettings` è un oggetto, sono supportate le seguenti configurazioni:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Mostra sfondo
  showBorder: true,        // Mostra bordo
  showDragHandle: true,    // Mostra maniglia di trascinamento
  style: {},              // Stile personalizzato della barra degli strumenti
  toolbarPosition: 'inside' // Posizione della barra degli strumenti: 'inside' | 'above' | 'below'
}}
```

## Ciclo di Vita del Rendering

L'intero ciclo di rendering chiama i seguenti metodi in ordine:

1.  **model.dispatchEvent('beforeRender')** - Evento `beforeRender`
2.  **model.render()** - Esegue il metodo di rendering del modello
3.  **model.onMount()** - Hook di montaggio del componente
4.  **model.onUnmount()** - Hook di smontaggio del componente

## Esempi di Utilizzo

### Rendering di Base

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Caricamento in corso...</div>}
    />
  );
}
```

### Rendering con Impostazioni del Flusso

```tsx pure
// Mostra le impostazioni ma nasconde il pulsante di rimozione
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Mostra impostazioni e titolo
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Utilizza la modalità menu contestuale
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Barra degli Strumenti Personalizzata

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Azione Personalizzata',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Azione personalizzata');
      }
    }
  ]}
/>
```

### Saltare i Flussi Automatici

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Rendering del Modello di Campo

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Gestione degli Errori

`FlowModelRenderer` include un meccanismo completo di gestione degli errori:

-   **Limite di Errore Automatico**: `showErrorFallback={true}` è abilitato per impostazione predefinita
-   **Errori del Flusso Automatico**: Cattura e gestisce gli errori durante l'esecuzione dei flussi automatici
-   **Errori di Rendering**: Mostra il contenuto di fallback quando il rendering del modello fallisce

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Rendering fallito, riprovi</div>}
/>
```

## Ottimizzazione delle Prestazioni

### Saltare i Flussi Automatici

Negli scenari in cui i flussi automatici non sono necessari, può saltarli per migliorare le prestazioni:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Aggiornamenti Reattivi

`FlowModelRenderer` utilizza l'observer di `@formily/reactive-react` per gli aggiornamenti reattivi, garantendo che il componente si ri-renderizzi automaticamente quando lo stato del modello cambia.

## Note

1.  **Validazione del Modello**: Si assicuri che il `model` passato abbia un metodo `render` valido.
2.  **Gestione del Ciclo di Vita**: Gli hook del ciclo di vita del modello verranno chiamati al momento opportuno.
3.  **Limite di Errore**: Si raccomanda di abilitare il limite di errore in un ambiente di produzione per fornire una migliore esperienza utente.
4.  **Considerazioni sulle Prestazioni**: Per scenari che coinvolgono il rendering di un gran numero di modelli, consideri l'utilizzo dell'opzione `skipApplyAutoFlows`.