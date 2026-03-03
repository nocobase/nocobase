:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/view).
:::

# ctx.view

Aktuálně aktivní ovladač zobrazení (dialogové okno, výsuvný panel, popover, vložená oblast atd.), který slouží k přístupu k informacím a operacím na úrovni zobrazení. Poskytuje jej `FlowViewContext` a je k dispozici pouze v obsahu zobrazení otevřeném pomocí `ctx.viewer` nebo `ctx.openView`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Obsah dialogu/výsuvného panelu** | Použijte `ctx.view.close()` v rámci `content` pro zavření aktuálního zobrazení, nebo použijte `Header` a `Footer` pro vykreslení záhlaví a zápatí. |
| **Po odeslání formuláře** | Po úspěšném odeslání zavolejte `ctx.view.close(result)` pro zavření zobrazení a vrácení výsledku. |
| **JSBlock / Akce** | Určete aktuální typ zobrazení pomocí `ctx.view.type` nebo načtěte parametry otevření z `ctx.view.inputArgs`. |
| **Výběr vazeb, podtabulky** | Načtěte `collectionName`, `filterByTk`, `parentId` atd. z `inputArgs` pro načítání dat. |

> Poznámka: `ctx.view` je k dispozici pouze v prostředích RunJS s kontextem zobrazení (např. uvnitř `content` v `ctx.viewer.dialog()`, v dialogových formulářích nebo uvnitř selektorů vazeb). V běžných stránkách nebo backendovém kontextu je `undefined`. Při použití doporučujeme používat volitelné řetězení (`ctx.view?.close?.()`).

## Definice typu

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
  submit?: () => Promise<any>;  // K dispozici v zobrazeních konfigurace pracovního postupu
};
```

## Běžné vlastnosti a metody

| Vlastnost/Metoda | Typ | Popis |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Aktuální typ zobrazení |
| `inputArgs` | `Record<string, any>` | Parametry předané při otevření zobrazení (viz níže) |
| `Header` | `React.FC \| null` | Komponenta záhlaví, slouží k vykreslení názvu a oblasti akcí |
| `Footer` | `React.FC \| null` | Komponenta zápatí, slouží k vykreslení tlačítek atd. |
| `close(result?, force?)` | `void` | Zavře aktuální zobrazení; `result` lze předat zpět volajícímu |
| `update(newConfig)` | `void` | Aktualizuje konfiguraci zobrazení (např. šířku, název) |
| `navigation` | `ViewNavigation \| undefined` | Navigace v rámci zobrazení na stránce, včetně přepínání karet (Tab) atd. |

> V současné době podporují `Header` a `Footer` pouze `dialog` a `drawer`.

## Běžná pole v inputArgs

Pole v `inputArgs` se liší podle scénáře otevření. Mezi běžná pole patří:

| Pole | Popis |
|------|------|
| `viewUid` | UID zobrazení |
| `collectionName` | Název kolekce |
| `filterByTk` | Filtr primárního klíče (pro detail jednoho záznamu) |
| `parentId` | ID nadřazeného záznamu (pro scénáře vazeb) |
| `sourceId` | ID zdrojového záznamu |
| `parentItem` | Data nadřazené položky |
| `scene` | Scéna (např. `create`, `edit`, `select`) |
| `onChange` | Zpětné volání po výběru nebo změně |
| `tabUid` | UID aktuální karty (v rámci stránky) |

K těmto polím přistupujte pomocí `ctx.getVar('ctx.view.inputArgs.xxx')` nebo `ctx.view.inputArgs.xxx`.

## Příklady

### Zavření aktuálního zobrazení

```ts
// Zavření dialogu po úspěšném odeslání
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Zavření a vrácení výsledků
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Použití Header / Footer v obsahu

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Upravit" extra={<Button size="small">Nápověda</Button>} />
      <div>Obsah formuláře...</div>
      <Footer>
        <Button onClick={() => close()}>Zrušit</Button>
        <Button type="primary" onClick={handleSubmit}>Odeslat</Button>
      </Footer>
    </div>
  );
}
```

### Větvení na základě typu zobrazení nebo inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Skrytí záhlaví ve vložených zobrazeních
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Scénář výběru uživatele
}
```

## Vztah s ctx.viewer a ctx.openView

| Účel | Doporučené použití |
|------|----------|
| **Otevření nového zobrazení** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` nebo `ctx.openView()` |
| **Operace s aktuálním zobrazením** | `ctx.view.close()`, `ctx.view.update()` |
| **Získání parametrů otevření** | `ctx.view.inputArgs` |

`ctx.viewer` je zodpovědný za „otevření“ zobrazení, zatímco `ctx.view` představuje „aktuální“ instanci zobrazení; `ctx.openView` se používá k otevření předkonfigurovaných zobrazení pracovního postupu.

## Poznámky

- `ctx.view` je k dispozici pouze uvnitř zobrazení; na běžných stránkách je `undefined`.
- Používejte volitelné řetězení: `ctx.view?.close?.()`, abyste předešli chybám v případě, že neexistuje kontext zobrazení.
- Hodnota `result` z `close(result)` je předána do Promise vráceného metodou `ctx.viewer.open()`.

## Související

- [ctx.openView()](./open-view.md): Otevření předkonfigurovaného zobrazení pracovního postupu
- [ctx.modal](./modal.md): Lehká vyskakovací okna (informace, potvrzení atd.)

> `ctx.viewer` poskytuje metody jako `dialog()`, `drawer()`, `popover()` a `embed()` pro otevírání zobrazení. Obsah (`content`) otevřený těmito metodami má přístup k `ctx.view`.