:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vlastní interaktivní události

V editoru událostí můžete psát JavaScript a registrovat interaktivní chování prostřednictvím instance ECharts `chart`, abyste umožnili propojení. Například můžete přesměrovat na novou stránku nebo otevřít vyskakovací okno pro podrobnou analýzu.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Registrace a zrušení registrace událostí
- Registrace: `chart.on(eventName, handler)`
- Zrušení registrace: `chart.off(eventName, handler)` nebo `chart.off(eventName)` pro vymazání událostí se stejným názvem.

**Poznámka:**
Z bezpečnostních důvodů důrazně doporučujeme zrušit registraci události předtím, než ji znovu zaregistrujete!

## Struktura dat parametru `params` funkce handleru

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Mezi běžně používaná pole patří `params.data` a `params.name`.

## Příklad: Kliknutím zvýrazníte výběr
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Zvýrazní aktuální datový bod
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Zruší zvýraznění ostatních
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Příklad: Kliknutím přejdete na stránku
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Možnost 1: Interní navigace bez úplného obnovení stránky (doporučeno), stačí relativní cesta
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Možnost 2: Navigace na externí stránku, vyžaduje se úplná URL adresa
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Možnost 3: Otevření externí stránky v nové záložce, vyžaduje se úplná URL adresa
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Příklad: Kliknutím otevřete dialogové okno s detaily (podrobná analýza)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // registrujte kontextové proměnné pro nové dialogové okno
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

V nově otevřeném dialogovém okně použijte kontextové proměnné grafu prostřednictvím `ctx.view.inputArgs.XXX`.

## Náhled a uložení
- Kliknutím na „Náhled“ načtete a spustíte kód události.
- Kliknutím na „Uložit“ uložíte aktuální konfiguraci události.
- Kliknutím na „Zrušit“ se vrátíte k naposledy uloženému stavu.

**Doporučení:**
- Před každým navázáním vždy použijte `chart.off('event')`, abyste předešli duplicitnímu spouštění nebo zvýšené spotřebě paměti způsobené vícenásobným navázáním.
- V rámci obslužných rutin událostí se snažte používat lehké operace (např. `dispatchAction`, `setOption`), abyste předešli blokování procesu vykreslování.
- Ověřte s možnostmi grafu a dotazy na data, abyste zajistili, že pole zpracovávaná v události jsou konzistentní s aktuálními daty.