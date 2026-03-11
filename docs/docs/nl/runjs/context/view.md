:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/view) voor nauwkeurige informatie.
:::

# ctx.view

De momenteel actieve view-controller (dialoogvenster, lade, popover, ingebed gebied, enz.), gebruikt voor toegang tot informatie en bewerkingen op view-niveau. Geleverd door `FlowViewContext`, deze is alleen beschikbaar binnen view-inhoud die is geopend via `ctx.viewer` of `ctx.openView`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Inhoud dialoogvenster/lade** | Gebruik `ctx.view.close()` binnen de `content` om de huidige view te sluiten, of gebruik `Header` en `Footer` om titels en voetteksten te renderen. |
| **Na het indienen van een formulier** | Roep `ctx.view.close(result)` aan na een succesvolle indiening om de view te sluiten en het resultaat terug te sturen. |
| **JSBlock / Actie** | Bepaal het huidige view-type via `ctx.view.type`, of lees de parameters voor het openen uit `ctx.view.inputArgs`. |
| **Associatieselectie, subtabellen** | Lees `collectionName`, `filterByTk`, `parentId`, enz. uit `inputArgs` voor het laden van gegevens. |

> Let op: `ctx.view` is alleen beschikbaar in RunJS-omgevingen met een view-context (bijv. binnen de `content` van `ctx.viewer.dialog()`, in dialoogformulieren of binnen associatieselectors). In standaardpagina's of backend-contexten is dit `undefined`. Het wordt aanbevolen om optional chaining te gebruiken (`ctx.view?.close?.()`).

## Type-definitie

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Beschikbaar in workflow-configuratieviews
};
```

## Veelgebruikte eigenschappen en methoden

| Eigenschap/Methode | Type | Beschrijving |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Huidig view-type |
| `inputArgs` | `Record<string, any>` | Parameters die zijn doorgegeven bij het openen van de view, zie hieronder |
| `Header` | `React.FC \| null` | Header-component, gebruikt voor het renderen van titels en actiegebieden |
| `Footer` | `React.FC \| null` | Footer-component, gebruikt voor het renderen van knoppen, enz. |
| `close(result?, force?)` | `void` | Sluit de huidige view; `result` kan worden teruggegeven aan de aanroeper |
| `update(newConfig)` | `void` | Werkt de view-configuratie bij (bijv. breedte, titel) |
| `navigation` | `ViewNavigation \| undefined` | View-navigatie binnen de pagina, inclusief Tab-wisseling, enz. |

> Momenteel ondersteunen alleen `dialog` en `drawer` de componenten `Header` en `Footer`.

## Veelvoorkomende velden in inputArgs

De velden in `inputArgs` variëren afhankelijk van het scenario waarin de view wordt geopend. Veelvoorkomende velden zijn:

| Veld | Beschrijving |
|------|------|
| `viewUid` | View UID |
| `collectionName` | Collectienaam |
| `filterByTk` | Filter op primaire sleutel (voor details van een enkel record) |
| `parentId` | Ouder-ID (voor associatie-scenario's) |
| `sourceId` | Bronrecord-ID |
| `parentItem` | Gegevens van het ouder-item |
| `scene` | Scène (bijv. `create`, `edit`, `select`) |
| `onChange` | Callback na selectie of wijziging |
| `tabUid` | Huidige Tab UID (binnen een pagina) |

U heeft toegang tot deze velden via `ctx.getVar('ctx.view.inputArgs.xxx')` of `ctx.view.inputArgs.xxx`.

## Voorbeelden

### De huidige view sluiten

```ts
// Sluit dialoogvenster na succesvolle indiening
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Sluit en geef resultaten terug
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Header / Footer gebruiken in content

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Bewerken" extra={<Button size="small">Help</Button>} />
      <div>Formulierinhoud...</div>
      <Footer>
        <Button onClick={() => close()}>Annuleren</Button>
        <Button type="primary" onClick={handleSubmit}>Bevestigen</Button>
      </Footer>
    </div>
  );
}
```

### Vertakken op basis van view-type of inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Verberg header in ingebedde views
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Scenario voor gebruikersselector
}
```

## Relatie met ctx.viewer en ctx.openView

| Doel | Aanbevolen gebruik |
|------|----------|
| **Een nieuwe view openen** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` of `ctx.openView()` |
| **Huidige view bedienen** | `ctx.view.close()`, `ctx.view.update()` |
| **Parameters voor openen ophalen** | `ctx.view.inputArgs` |

`ctx.viewer` is verantwoordelijk voor het "openen" van een view, terwijl `ctx.view` de "huidige" view-instantie vertegenwoordigt; `ctx.openView` wordt gebruikt om vooraf geconfigureerde workflow-views te openen.

## Aandachtspunten

- `ctx.view` is alleen beschikbaar binnen een view; het is `undefined` op standaardpagina's.
- Gebruik optional chaining: `ctx.view?.close?.()` om fouten te voorkomen wanneer er geen view-context bestaat.
- Het `result` van `close(result)` wordt doorgegeven aan de Promise die wordt geretourneerd door `ctx.viewer.open()`.

## Gerelateerd

- [ctx.openView()](./open-view.md): Open een vooraf geconfigureerde workflow-view
- [ctx.modal](./modal.md): Lichtgewicht pop-ups (info, bevestiging, enz.)

> `ctx.viewer` biedt methoden zoals `dialog()`, `drawer()`, `popover()` en `embed()` om views te openen. De `content` die door deze methoden wordt geopend, heeft toegang tot `ctx.view`.