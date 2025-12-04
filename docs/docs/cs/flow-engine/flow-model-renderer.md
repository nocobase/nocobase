:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vykreslení FlowModel

`FlowModelRenderer` je klíčová React komponenta pro vykreslování `FlowModel`. Jejím úkolem je převést instanci `FlowModel` na vizuální React komponentu.

## Základní použití

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Základní použití
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Pro řízené modely polí použijte k vykreslení `FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Vykreslování řízeného pole
<FieldModelRenderer model={fieldModel} />
```

## Props

### FlowModelRendererProps

| Parametr | Typ | Výchozí | Popis |
|------|------|--------|------|
| `model` | `FlowModel` | - | Instance `FlowModel` k vykreslení |
| `uid` | `string` | - | Jedinečný identifikátor pro model pracovního postupu |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Obsah, který se zobrazí při selhání vykreslování |
| `showFlowSettings` | `boolean \| object` | `false` | Zda zobrazit vstup pro nastavení pracovního postupu |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Styl interakce pro nastavení pracovního postupu |
| `hideRemoveInSettings` | `boolean` | `false` | Zda skrýt tlačítko pro odebrání v nastavení |
| `showTitle` | `boolean` | `false` | Zda zobrazit název modelu v levém horním rohu ohraničení |
| `skipApplyAutoFlows` | `boolean` | `false` | Zda přeskočit aplikování automatických pracovních postupů |
| `inputArgs` | `Record<string, any>` | - | Dodatečný kontext předaný `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Zda obalit nejvzdálenější vrstvu komponentou `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Úroveň nabídky nastavení: 1=pouze aktuální model, 2=včetně podřízených modelů |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Další položky panelu nástrojů |

### Detailní konfigurace `showFlowSettings`

Pokud je `showFlowSettings` objekt, jsou podporovány následující konfigurace:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Zobrazit pozadí
  showBorder: true,        // Zobrazit ohraničení
  showDragHandle: true,    // Zobrazit úchyt pro přetažení
  style: {},              // Vlastní styl panelu nástrojů
  toolbarPosition: 'inside' // Pozice panelu nástrojů: 'inside' | 'above' | 'below'
}}
```

## Životní cyklus vykreslování

Celý cyklus vykreslování volá následující metody v uvedeném pořadí:

1.  **model.dispatchEvent('beforeRender')** – Událost před vykreslením
2.  **model.render()** – Spustí metodu vykreslování modelu
3.  **model.onMount()** – Hook pro připojení komponenty
4.  **model.onUnmount()** – Hook pro odpojení komponenty

## Příklady použití

### Základní vykreslování

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Načítání...</div>}
    />
  );
}
```

### Vykreslování s nastavením pracovního postupu

```tsx pure
// Zobrazit nastavení, ale skrýt tlačítko pro odebrání
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Zobrazit nastavení a název
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Použít režim kontextové nabídky
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Vlastní panel nástrojů

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Vlastní akce',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Vlastní akce');
      }
    }
  ]}
/>
```

### Přeskočení automatických pracovních postupů

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Vykreslování modelu pole

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

## Zpracování chyb

`FlowModelRenderer` obsahuje komplexní vestavěný mechanismus pro zpracování chyb:

-   **Automatické hranice chyb**: `showErrorFallback={true}` je ve výchozím nastavení povoleno
-   **Chyby automatických pracovních postupů**: Zachytává a zpracovává chyby během provádění automatických pracovních postupů
-   **Chyby vykreslování**: Zobrazí záložní obsah, pokud se vykreslování modelu nezdaří

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Vykreslení se nezdařilo, zkuste to prosím znovu</div>}
/>
```

## Optimalizace výkonu

### Přeskočení automatických pracovních postupů

Ve scénářích, kde nejsou automatické pracovní postupy potřeba, je můžete přeskočit pro zlepšení výkonu:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reaktivní aktualizace

`FlowModelRenderer` využívá `observer` z `@formily/reactive-react` pro reaktivní aktualizace, což zajišťuje, že se komponenta automaticky znovu vykreslí při změně stavu modelu.

## Důležité poznámky

1.  **Validace modelu**: Ujistěte se, že předaný `model` má platnou metodu `render`.
2.  **Správa životního cyklu**: Hooky životního cyklu modelu budou volány ve vhodných okamžicích.
3.  **Hranice chyb**: Doporučuje se povolit hranice chyb v produkčním prostředí pro zajištění lepší uživatelské zkušenosti.
4.  **Aspekty výkonu**: Pro scénáře zahrnující vykreslování velkého počtu modelů zvažte použití možnosti `skipApplyAutoFlows`.