:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/view).
:::

# ctx.view

Den aktuella aktiva vykontrollern (dialogruta, sidopanel, popover, inbäddat område etc.), som används för att komma åt information och åtgärder på vynivå. Den tillhandahålls av `FlowViewContext` och är endast tillgänglig i vyinnehåll som öppnats via `ctx.viewer` eller `ctx.openView`.

## Tillämpningsscenarier

| Scenario | Beskrivning |
|------|------|
| **Innehåll i dialogruta/sidopanel** | Använd `ctx.view.close()` i `content` för att stänga den aktuella vyn, eller använd `Header` och `Footer` för att rendera titlar och sidfötter. |
| **Efter formulärinskickning** | Anropa `ctx.view.close(result)` efter en lyckad inskickning för att stänga vyn och skicka tillbaka resultatet. |
| **JSBlock / Åtgärd** | Avgör den aktuella vytypen via `ctx.view.type`, eller läs öppningsparametrar från `ctx.view.inputArgs`. |
| **Val av associationer, undertabeller** | Läs `collectionName`, `filterByTk`, `parentId` etc. från `inputArgs` för dataladdning. |

> Observera: `ctx.view` är endast tillgänglig i RunJS-miljöer med ett vy-sammanhang (t.ex. inuti `content` för `ctx.viewer.dialog()`, i dialogformulär eller inuti associationsväljare). I vanliga sidor eller backend-sammanhang är den `undefined`. Det rekommenderas att använda valfri länkning (optional chaining) (`ctx.view?.close?.()`).

## Typdefinition

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
  submit?: () => Promise<any>;  // Tillgänglig i konfigurationsvyer för arbetsflöden
};
```

## Vanliga egenskaper och metoder

| Egenskap/Metod | Typ | Beskrivning |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Aktuell vytyp |
| `inputArgs` | `Record<string, any>` | Parametrar som skickas när vyn öppnas, se nedan |
| `Header` | `React.FC \| null` | Huvudkomponent, används för att rendera titlar och åtgärdsområden |
| `Footer` | `React.FC \| null` | Sidfotskomponent, används för att rendera knappar etc. |
| `close(result?, force?)` | `void` | Stänger den aktuella vyn; `result` kan skickas tillbaka till anroparen |
| `update(newConfig)` | `void` | Uppdaterar vykonfigurationen (t.ex. bredd, titel) |
| `navigation` | `ViewNavigation \| undefined` | Vynavigering på sidan, inklusive flikbyte etc. |

> För närvarande stöder endast `dialog` och `drawer` komponenterna `Header` och `Footer`.

## Vanliga fält i inputArgs

Fälten i `inputArgs` varierar beroende på öppningsscenariot. Vanliga fält inkluderar:

| Fält | Beskrivning |
|------|------|
| `viewUid` | Vy-UID |
| `collectionName` | Namn på samling |
| `filterByTk` | Primärnyckelfilter (för detaljer om en enskild post) |
| `parentId` | Överordnat ID (för associationsscenarier) |
| `sourceId` | Källpost-ID |
| `parentItem` | Data för överordnat objekt |
| `scene` | Scen (t.ex. `create`, `edit`, `select`) |
| `onChange` | Callback efter val eller ändring |
| `tabUid` | Aktuellt flik-UID (inom en sida) |

Kom åt dessa via `ctx.getVar('ctx.view.inputArgs.xxx')` eller `ctx.view.inputArgs.xxx`.

## Exempel

### Stänga den aktuella vyn

```ts
// Stäng dialogrutan efter lyckad inskickning
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Stäng och returnera resultat
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Använda Header / Footer i innehåll

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Redigera" extra={<Button size="small">Hjälp</Button>} />
      <div>Formulärinnehåll...</div>
      <Footer>
        <Button onClick={() => close()}>Avbryt</Button>
        <Button type="primary" onClick={handleSubmit}>Skicka</Button>
      </Footer>
    </div>
  );
}
```

### Villkorsstyrning baserat på vytyp eller inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Dölj sidhuvudet i inbäddade vyer
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Scenario för användarväljare
}
```

## Relation till ctx.viewer och ctx.openView

| Syfte | Rekommenderad användning |
|------|----------|
| **Öppna en ny vy** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` eller `ctx.openView()` |
| **Hantera aktuell vy** | `ctx.view.close()`, `ctx.view.update()` |
| **Hämta öppningsparametrar** | `ctx.view.inputArgs` |

`ctx.viewer` ansvarar för att "öppna" en vy, medan `ctx.view` representerar den "aktuella" vyinstansen; `ctx.openView` används för att öppna förkonfigurerade vyer för arbetsflöden.

## Observera

- `ctx.view` är endast tillgänglig inuti en vy; den är `undefined` på vanliga sidor.
- Använd valfri länkning (optional chaining): `ctx.view?.close?.()` för att undvika fel när inget vy-sammanhang finns.
- `result` från `close(result)` skickas till det Promise som returneras av `ctx.viewer.open()`.

## Relaterat

- [ctx.openView()](./open-view.md): Öppna en förkonfigurerad vy för arbetsflöde
- [ctx.modal](./modal.md): Lätta popup-fönster (info, bekräftelse etc.)

> `ctx.viewer` tillhandahåller metoder som `dialog()`, `drawer()`, `popover()` och `embed()` för att öppna vyer. Innehållet (`content`) som öppnas av dessa metoder kan komma åt `ctx.view`.