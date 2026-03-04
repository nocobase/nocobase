:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/render).
:::

# ctx.render()

Vykresluje React elementy, HTML řetězce nebo DOM uzly do zadaného kontejneru. Pokud není `container` zadán, ve výchozím nastavení se vykresluje do `ctx.element` a automaticky dědí kontext aplikace, jako je ConfigProvider, témata atd.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock** | Vykreslení vlastního obsahu bloku (grafy, seznamy, karty atd.) |
| **JSField / JSItem / JSColumn** | Vykreslení vlastního zobrazení pro upravitelná pole nebo sloupce tabulky |
| **Blok detailů** | Přizpůsobení formátu zobrazení polí na stránkách s detaily |

> Poznámka: `ctx.render()` vyžaduje kontejner pro vykreslování. Pokud není předán `container` a `ctx.element` neexistuje (např. v čistě logických scénářích bez UI), dojde k chybě.

## Definice typu

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parametr | Typ | Popis |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Obsah k vykreslení |
| `container` | `Element` \| `DocumentFragment` (volitelné) | Cílový kontejner pro vykreslování, výchozí je `ctx.element` |

**Návratová hodnota**:

- Při vykreslování **React elementu**: Vrátí `ReactDOMClient.Root`, což usnadňuje následné volání `root.render()` pro aktualizace.
- Při vykreslování **HTML řetězce** nebo **DOM uzlu**: Vrátí `null`.

## Popis typů vnode

| Typ | Chování |
|------|------|
| `React.ReactElement` (JSX) | Vykresleno pomocí `createRoot` z Reactu, poskytuje plné možnosti Reactu a automaticky dědí kontext aplikace. |
| `string` | Nastaví `innerHTML` kontejneru po vyčištění pomocí DOMPurify; jakýkoli existující kořen Reactu bude nejprve odpojen (unmounted). |
| `Node` (Element, Text atd.) | Připojí se pomocí `appendChild` po vyčištění kontejneru; jakýkoli existující kořen Reactu bude nejprve odpojen. |
| `DocumentFragment` | Připojí podřízené uzly fragmentu do kontejneru; jakýkoli existující kořen Reactu bude nejprve odpojen. |

## Příklady

### Vykreslování React elementů (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Nadpis')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Kliknuto'))}>
      {ctx.t('Tlačítko')}
    </Button>
  </Card>
);
```

### Vykreslování HTML řetězců

```ts
ctx.render('<h1>Hello World</h1>');

// Kombinace s ctx.t pro internacionalizaci
ctx.render('<div style="padding:16px">' + ctx.t('Obsah') + '</div>');

// Podmíněné vykreslování
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Žádná data') + '</span>');
```

### Vykreslování DOM uzlů

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Nejprve vykreslete prázdný kontejner a poté jej předejte knihovně třetí strany (např. ECharts) k inicializaci
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Určení vlastního kontejneru

```ts
// Vykreslení do konkrétního DOM elementu
const customEl = document.getElementById('my-container');
ctx.render(<div>Obsah</div>, customEl);
```

### Opakovaná volání nahradí obsah

```ts
// Druhé volání nahradí stávající obsah v kontejneru
ctx.render(<div>Poprvé</div>);
ctx.render(<div>Podruhé</div>);  // Zobrazí se pouze „Podruhé“
```

## Poznámky

- **Opakovaná volání nahrazují obsah**: Každé volání `ctx.render()` nahradí stávající obsah v kontejneru, místo aby jej připojilo.
- **Bezpečnost HTML řetězců**: Předané HTML je vyčištěno pomocí DOMPurify, aby se snížilo riziko XSS, ale přesto se doporučuje vyhnout se spojování nedůvěryhodných uživatelských vstupů.
- **Nemanipulujte přímo s ctx.element**: `ctx.element.innerHTML` je zastaralé; místo toho by se mělo konzistentně používat `ctx.render()`.
- **Předávejte kontejner, pokud neexistuje výchozí**: V situacích, kdy je `ctx.element` `undefined` (např. v modulech načtených přes `ctx.importAsync`), musí být `container` explicitně poskytnut.

## Související

- [ctx.element](./element.md) - Výchozí kontejner pro vykreslování, používá se, když není do `ctx.render()` předán žádný kontejner.
- [ctx.libs](./libs.md) - Vestavěné knihovny jako React a Ant Design, používané pro vykreslování JSX.
- [ctx.importAsync()](./import-async.md) - Používá se ve spojení s `ctx.render()` po načtení externích knihoven Reactu/komponent podle potřeby.