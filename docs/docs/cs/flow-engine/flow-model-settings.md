:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# FlowModel – Toky a konfigurace

`FlowModel` nabízí přístup založený na „tocích (Flow)“ pro implementaci konfigurační logiky komponent, čímž zajišťuje větší rozšiřitelnost a vizualizaci chování a konfigurace komponent.

## Vlastní Model

Vlastní model komponenty můžete vytvořit děděním z `FlowModel`. Model musí implementovat metodu `render()`, aby definoval logiku vykreslování komponenty.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Registrace Toku (Flow)

Každý model může registrovat jeden nebo více **Toků**, které popisují konfigurační logiku a interakční kroky komponenty.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Nastavení tlačítka',
  steps: {
    general: {
      title: 'Obecná konfigurace',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Název tlačítka',
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

Popis

-   `key`: Jedinečný identifikátor Toku.
-   `title`: Název Toku, používaný pro zobrazení v uživatelském rozhraní.
-   `steps`: Definuje konfigurační kroky (Step). Každý krok zahrnuje:
    -   `title`: Název kroku.
    -   `uiSchema`: Struktura konfiguračního formuláře (kompatibilní s Formily Schema).
    -   `defaultParams`: Výchozí parametry.
    -   `handler(ctx, params)`: Spustí se při uložení a slouží k aktualizaci stavu modelu.

## Vykreslování Modelu

Při vykreslování modelu komponenty můžete pomocí parametru `showFlowSettings` řídit, zda se má povolit konfigurační funkce. Pokud je `showFlowSettings` povoleno, v pravém horním rohu komponenty se automaticky zobrazí vstup pro konfiguraci (například ikona nastavení nebo tlačítko).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Ruční otevření konfiguračního formuláře pomocí `openFlowSettings`

Kromě otevření konfiguračního formuláře pomocí vestavěného interaktivního vstupu můžete také ručně volat
`openFlowSettings()`.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definice parametrů

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Povinné, instance modelu, ke které patří
  preset?: boolean;               // Vykreslí pouze kroky označené jako preset=true (výchozí false)
  flowKey?: string;               // Určuje jeden Tok
  flowKeys?: string[];            // Určuje více Toků (ignorováno, pokud je zároveň zadán flowKey)
  stepKey?: string;               // Určuje jeden krok (obvykle se používá s flowKey)
  uiMode?: 'dialog' | 'drawer';   // Kontejner pro zobrazení formuláře, výchozí 'dialog'
  onCancel?: () => void;          // Callback při kliknutí na zrušit
  onSaved?: () => void;           // Callback po úspěšném uložení konfigurace
}
```

### Příklad: Otevření konfiguračního formuláře specifického Toku v režimu Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Konfigurace tlačítka uložena');
  },
});
```