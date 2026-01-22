:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel Renderen

`FlowModelRenderer` is de kern React-component voor het renderen van een `FlowModel`. Het is verantwoordelijk voor het omzetten van een `FlowModel`-instantie naar een visuele React-component.

## Basisgebruik

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Basisgebruik
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Gebruik voor gecontroleerde veldmodellen de `FieldModelRenderer` om ze te renderen:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Renderen van gecontroleerd veld
<FieldModelRenderer model={fieldModel} />
```

## Props

### FlowModelRendererProps

| Parameter | Type | Standaardwaarde | Beschrijving |
|-----------|------|-----------------|--------------|
| `model` | `FlowModel` | - | De FlowModel-instantie die gerenderd moet worden |
| `uid` | `string` | - | De unieke identificatie voor het workflowmodel |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Terugvalinhoud die wordt weergegeven bij een renderfout |
| `showFlowSettings` | `boolean \| object` | `false` | Of de ingang voor workflowinstellingen moet worden weergegeven |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | De interactiestijl voor workflowinstellingen |
| `hideRemoveInSettings` | `boolean` | `false` | Of de verwijderknop in de instellingen moet worden verborgen |
| `showTitle` | `boolean` | `false` | Of de modeltitel in de linkerbovenhoek van de rand moet worden weergegeven |
| `skipApplyAutoFlows` | `boolean` | `false` | Of het toepassen van automatische workflows moet worden overgeslagen |
| `inputArgs` | `Record<string, any>` | - | Extra context die wordt doorgegeven aan `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Of de buitenste laag moet worden omwikkeld met de `FlowErrorFallback`-component |
| `settingsMenuLevel` | `number` | - | Niveau van het instellingenmenu: 1=alleen huidig model, 2=inclusief submodellen |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Extra werkbalkitems |

### `showFlowSettings` Gedetailleerde Configuratie

Wanneer `showFlowSettings` een object is, worden de volgende configuraties ondersteund:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Achtergrond weergeven
  showBorder: true,        // Rand weergeven
  showDragHandle: true,    // Sleepgreep weergeven
  style: {},              // Aangepaste werkbalkstijl
  toolbarPosition: 'inside' // Positie werkbalk: 'inside' | 'above' | 'below'
}}
```

## Renderingscyclus

De volledige renderingscyclus roept de volgende methoden in volgorde aan:

1.  **model.dispatchEvent('beforeRender')** - `beforeRender`-gebeurtenis
2.  **model.render()** - Voert de rendermethode van het model uit
3.  **model.onMount()** - Component mount-hook
4.  **model.onUnmount()** - Component unmount-hook

## Gebruiksvoorbeelden

### Basisrendering

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Laden...</div>}
    />
  );
}
```

### Renderen met workflowinstellingen

```tsx pure
// Instellingen weergeven, maar de verwijderknop verbergen
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Instellingen en titel weergeven
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Contextmenumodus gebruiken
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Aangepaste werkbalk

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Aangepaste actie',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Aangepaste actie');
      }
    }
  ]}
/>
```

### Automatische workflows overslaan

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Veldmodel renderen

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

## Foutafhandeling

`FlowModelRenderer` heeft een uitgebreid ingebouwd foutafhandelingsmechanisme:

-   **Automatische foutgrens**: `showErrorFallback={true}` is standaard ingeschakeld
-   **Fouten in automatische workflows**: Vangt en verwerkt fouten tijdens de uitvoering van automatische workflows
-   **Renderfouten**: Geeft terugvalinhoud weer wanneer het renderen van het model mislukt

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Renderen mislukt, probeer het opnieuw</div>}
/>
```

## Prestatieoptimalisatie

### Automatische workflows overslaan

Voor scenario's waarin automatische workflows niet nodig zijn, kunt u deze overslaan om de prestaties te verbeteren:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reactieve updates

`FlowModelRenderer` gebruikt de `observer` van `@formily/reactive-react` voor reactieve updates, zodat de component automatisch opnieuw rendert wanneer de status van het model verandert.

## Aandachtspunten

1.  **Modelvalidatie**: Zorg ervoor dat het doorgegeven `model` een geldige `render`-methode heeft.
2.  **Levenscyclusbeheer**: De levenscyclus-hooks van het model worden op de juiste momenten aangeroepen.
3.  **Foutgrens**: Het wordt aanbevolen om de foutgrens in een productieomgeving in te schakelen voor een betere gebruikerservaring.
4.  **Prestatieoverweging**: Voor scenario's waarbij een groot aantal modellen wordt gerenderd, kunt u overwegen de optie `skipApplyAutoFlows` te gebruiken.