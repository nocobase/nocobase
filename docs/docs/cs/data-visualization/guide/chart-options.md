:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Možnosti grafu

Zde můžete nastavit způsob zobrazení grafů. Podporovány jsou dva režimy: Základní (vizuální) a Vlastní (JS). Základní režim je ideální pro rychlé mapování a běžná nastavení; Vlastní režim se hodí pro složité scénáře a pokročilé úpravy.

## Rozložení panelu

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tip: Pro snazší konfiguraci aktuálního obsahu můžete nejprve sbalit ostatní panely.

Nahoře je panel akcí
Výběr režimu:
- **Základní:** Vizuální konfigurace. Vyberte typ a dokončete mapování polí; běžná nastavení upravíte přímo pomocí přepínačů.
- **Vlastní:** Napište JS kód v editoru a vraťte ECharts `option`.

## Základní režim

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Výběr typu grafu
- Podporované typy: čárový, plošný, sloupcový, pruhový, koláčový, prstencový, trychtýřový, bodový graf atd.
- Požadovaná pole se liší podle typu grafu. Nejprve zkontrolujte názvy a typy sloupců v sekci „Dotaz na data → Zobrazit data“.

### Mapování polí
- Čárový/plošný/sloupcový/pruhový:
  - `xField`: dimenze (např. datum, kategorie, region)
  - `yField`: míra (agregovaná číselná hodnota)
  - `seriesField` (volitelné): seskupení řad (pro více čar/skupin sloupců)
- Koláčový/prstencový:
  - `Category`: kategorická dimenze
  - `Value`: míra
- Trychtýřový:
  - `Category`: fáze/kategorie
  - `Value`: hodnota (obvykle počet nebo procento)
- Bodový:
  - `xField`, `yField`: dvě míry nebo dimenze pro osy

> Další možnosti konfigurace grafu naleznete v dokumentaci ECharts: [Osa](https://echarts.apache.org/handbook/en/concepts/axis) a [Příklady](https://echarts.apache.org/examples/en/index.html)

**Poznámky:**
- Po změně dimenzí nebo měr znovu zkontrolujte mapování, abyste předešli prázdným nebo nesprávně zarovnaným grafům.
- Koláčové/prstencové a trychtýřové grafy musí poskytovat kombinaci „kategorie + hodnota“.

### Běžná nastavení

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Skládání, vyhlazení (čárový/plošný)
- Zobrazení popisků, nápověda (tooltip), legenda (legend)
- Rotace popisků os, dělicí čáry
- Poloměr a vnitřní poloměr koláčového/prstencového grafu, způsob řazení trychtýřového grafu

**Doporučení:**
- Pro časové řady použijte čárový/plošný graf a mírně zapněte vyhlazení; pro porovnání kategorií použijte sloupcový/pruhový graf.
- Při hustých datech není nutné zapínat všechny popisky, abyste předešli překrývání.

## Vlastní režim

Slouží k vrácení kompletního objektu ECharts `option`. Je vhodný pro pokročilé úpravy, jako je slučování více řad, složité nápovědy a dynamické styly.
Doporučený postup: sjednoťte data v `dataset.source`. Podrobnosti naleznete v dokumentaci ECharts: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Datový kontext
- `ctx.data.objects`: pole objektů (každý řádek jako objekt, doporučeno)
- `ctx.data.rows`: dvourozměrné pole (včetně záhlaví)
- `ctx.data.columns`: dvourozměrné pole seskupené podle sloupců

### Příklad: čárový graf měsíčních objednávek
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Náhled a uložení
- Po úpravách ve Vlastním režimu můžete kliknout na tlačítko **Náhled** vpravo a aktualizovat náhled grafu.
- Ve spodní části klikněte na **Uložit**, aby se konfigurace použila a uložila; kliknutím na **Zrušit** vrátíte zpět všechny provedené změny.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Další informace o možnostech grafu naleznete v části [Pokročilé — Vlastní konfigurace grafu](#).