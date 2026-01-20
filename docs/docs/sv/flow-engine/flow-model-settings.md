:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# FlowModel – Flöden och Konfiguration

FlowModel erbjuder ett tillvägagångssätt baserat på "händelseflöden" (Flow) för att implementera komponenters konfigurationslogik. Detta gör komponenternas beteende och konfiguration mer utbyggbara och visuella.

## Anpassad modell

Ni kan skapa en anpassad komponentmodell genom att ärva från `FlowModel`. Modellen måste implementera metoden `render()` för att definiera komponentens renderingslogik.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Registrera ett flöde

Varje modell kan registrera ett eller flera **flöden** för att beskriva komponentens konfigurationslogik och interaktionssteg.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Knappinställningar',
  steps: {
    general: {
      title: 'Allmän konfiguration',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Knapprubrik',
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

Beskrivning

-   `key`: Flödets unika identifierare.
-   `title`: Flödets namn, används för visning i användargränssnittet (UI).
-   `steps`: Definierar konfigurationsstegen (Step). Varje steg inkluderar:
    -   `title`: Stegets rubrik.
    -   `uiSchema`: Konfigurationsformulärstrukturen (kompatibel med Formily Schema).
    -   `defaultParams`: Standardparametrar.
    -   `handler(ctx, params)`: Utlöses vid sparning för att uppdatera modellens tillstånd.

## Rendera modellen

När ni renderar en komponentmodell kan ni använda parametern `showFlowSettings` för att styra om konfigurationsfunktionen ska aktiveras. Om `showFlowSettings` är aktiverad kommer en konfigurationsingång (till exempel en inställningsikon eller knapp) automatiskt att visas i komponentens övre högra hörn.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Öppna konfigurationsformuläret manuellt med openFlowSettings

Förutom att öppna konfigurationsformuläret via den inbyggda interaktionsingången kan ni även anropa `openFlowSettings()` manuellt i koden.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Parameterdefinitioner

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Obligatorisk, den modellinstans den tillhör
  preset?: boolean;               // Renderar endast steg markerade som preset=true (standard false)
  flowKey?: string;               // Ange ett enskilt flöde
  flowKeys?: string[];            // Ange flera flöden (ignoreras om flowKey också anges)
  stepKey?: string;               // Ange ett enskilt steg (används vanligtvis tillsammans med flowKey)
  uiMode?: 'dialog' | 'drawer';   // Behållaren för att visa formuläret, standard 'dialog'
  onCancel?: () => void;          // Callback när avbryt klickas
  onSaved?: () => void;           // Callback efter att konfigurationen har sparats framgångsrikt
}
```

### Exempel: Öppna konfigurationsformuläret för ett specifikt flöde i "Drawer"-läge

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Knappkonfigurationen har sparats');
  },
});
```