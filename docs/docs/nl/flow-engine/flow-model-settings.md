:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel: Eventstroom en Configuratie

FlowModel biedt een op 'eventstromen' (Flows) gebaseerde aanpak om de configuratielogica van componenten te implementeren. Dit maakt het gedrag en de configuratie van componenten flexibeler en visueler.

## Aangepast Model

U kunt een aangepast componentmodel maken door `FlowModel` uit te breiden. Het model moet de `render()`-methode implementeren om de renderlogica van het component te definiëren.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Een Flow registreren

Elk model kan één of meerdere **Flows** registreren om de configuratielogica en interactiestappen van het component te beschrijven.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Knopinstellingen',
  steps: {
    general: {
      title: 'Algemene Configuratie',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Knoptitel',
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

Beschrijving

-   `key`: De unieke identificatie voor de Flow.
-   `title`: De naam van de Flow, gebruikt voor weergave in de gebruikersinterface.
-   `steps`: Definieert de configuratiestappen (Step). Elke stap omvat:
    -   `title`: De titel van de stap.
    -   `uiSchema`: De structuur van het configuratieformulier (compatibel met Formily Schema).
    -   `defaultParams`: Standaardparameters.
    -   `handler(ctx, params)`: Wordt geactiveerd bij opslaan om de status van het model bij te werken.

## Het Model renderen

Bij het renderen van een componentmodel kunt u met de parameter `showFlowSettings` bepalen of de configuratiefunctie moet worden ingeschakeld. Als `showFlowSettings` is ingeschakeld, verschijnt er automatisch een configuratie-ingang (zoals een instellingenicoon of -knop) in de rechterbovenhoek van het component.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Configuratieformulier handmatig openen met `openFlowSettings`

Naast het openen van het configuratieformulier via de ingebouwde interactie-ingang, kunt u `openFlowSettings()` ook handmatig aanroepen in uw code.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Parameterdefinities

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Verplicht, de modelinstantie waartoe het behoort
  preset?: boolean;               // Rendert alleen stappen die zijn gemarkeerd als preset=true (standaard false)
  flowKey?: string;               // Specificeer één Flow
  flowKeys?: string[];            // Specificeer meerdere Flows (wordt genegeerd als flowKey ook is opgegeven)
  stepKey?: string;               // Specificeer één stap (meestal gebruikt in combinatie met flowKey)
  uiMode?: 'dialog' | 'drawer';   // De container voor het weergeven van het formulier, standaard 'dialog'
  onCancel?: () => void;          // Callback bij klikken op annuleren
  onSaved?: () => void;           // Callback nadat de configuratie succesvol is opgeslagen
}
```

### Voorbeeld: Het configuratieformulier van een specifieke Flow openen in de 'Drawer'-modus

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Knopinstellingen opgeslagen');
  },
});
```