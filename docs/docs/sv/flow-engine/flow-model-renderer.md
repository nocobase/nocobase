:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Rendera FlowModel

`FlowModelRenderer` är React-komponenten som utgör kärnan för att rendera en `FlowModel`. Den ansvarar för att omvandla en `FlowModel`-instans till en visuell React-komponent.

## Grundläggande användning

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Grundläggande användning
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

För kontrollerade fältmodeller använder ni `FieldModelRenderer` för att rendera:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Rendering av kontrollerat fält
<FieldModelRenderer model={fieldModel} />
```

## Props-parametrar

### FlowModelRendererProps

| Parameter | Typ | Standardvärde | Beskrivning |
|------|------|--------|------|
| `model` | `FlowModel` | - | `FlowModel`-instansen som ska renderas |
| `uid` | `string` | - | Den unika identifieraren för arbetsflödesmodellen |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Innehåll som visas om renderingen misslyckas |
| `showFlowSettings` | `boolean \| object` | `false` | Om ingången till arbetsflödesinställningarna ska visas |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Interaktionsstilen för arbetsflödesinställningarna |
| `hideRemoveInSettings` | `boolean` | `false` | Om knappen för att ta bort ska döljas i inställningarna |
| `showTitle` | `boolean` | `false` | Om modellens titel ska visas i det övre vänstra hörnet av ramen |
| `skipApplyAutoFlows` | `boolean` | `false` | Om automatiska arbetsflöden ska hoppas över |
| `inputArgs` | `Record<string, any>` | - | Extra kontext som skickas till `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Om det yttersta lagret ska omslutas med komponenten `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Nivå för inställningsmenyn: 1=endast aktuell modell, 2=inkludera underordnade modeller |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Ytterligare verktygsfältsobjekt |

### Detaljerad konfiguration för `showFlowSettings`

När `showFlowSettings` är ett objekt stöds följande konfigurationer:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Visa bakgrund
  showBorder: true,        // Visa kantlinje
  showDragHandle: true,    // Visa draghandtag
  style: {},              // Anpassad verktygsfältsstil
  toolbarPosition: 'inside' // Verktygsfältets position: 'inside' | 'above' | 'below'
}}
```

## Renderingslivscykel

Hela renderingscykeln anropar följande metoder i ordning:

1.  **model.dispatchEvent('beforeRender')** - Händelse före rendering
2.  **model.render()** - Utför modellens render-metod
3.  **model.onMount()** - Komponentens monteringskrok
4.  **model.onUnmount()** - Komponentens avmonteringskrok

## Användningsexempel

### Grundläggande rendering

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Laddar...</div>}
    />
  );
}
```

### Rendering med arbetsflödesinställningar

```tsx pure
// Visa inställningar men dölj knappen för att ta bort
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Visa inställningar och titel
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Använd högerklicksmenyläge
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Anpassat verktygsfält

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Anpassad åtgärd',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Anpassad åtgärd');
      }
    }
  ]}
/>
```

### Hoppa över automatiska arbetsflöden

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Rendering av fältmodell

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

## Felhantering

`FlowModelRenderer` har en omfattande inbyggd felhanteringsmekanism:

-   **Automatisk felgräns**: `showErrorFallback={true}` är aktiverat som standard
-   **Fel i automatiska arbetsflöden**: Fångar och hanterar fel under exekvering av automatiska arbetsflöden
-   **Renderingsfel**: Visar reservinnehåll när modellrendering misslyckas

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Rendering misslyckades, försök igen</div>}
/>
```

## Prestandaoptimering

### Hoppa över automatiska arbetsflöden

För scenarier där automatiska arbetsflöden inte behövs kan ni hoppa över dem för att förbättra prestandan:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reaktiv uppdatering

`FlowModelRenderer` använder `observer` från `@formily/reactive-react` för reaktiva uppdateringar, vilket säkerställer att komponenten automatiskt renderas om när modellens tillstånd ändras.

## Att tänka på

1.  **Modellvalidering**: Säkerställ att den `model` som skickas in har en giltig `render`-metod.
2.  **Livscykelhantering**: Modellens livscykelkrokar anropas vid lämpliga tidpunkter.
3.  **Felgräns**: Vi rekommenderar att ni aktiverar felgränsen i en produktionsmiljö för att ge en bättre användarupplevelse.
4.  **Prestandaöverväganden**: För scenarier som involverar rendering av ett stort antal modeller, överväg att använda alternativet `skipApplyAutoFlows`.