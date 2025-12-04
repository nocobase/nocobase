:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Podmínka

## Úvod

Podobně jako příkaz `if` v programovacích jazycích, rozhoduje o dalším průběhu **pracovního postupu** na základě výsledku nakonfigurované podmínky.

## Vytvoření uzlu

Uzel Podmínka má dva režimy: „Pokračovat, pokud je pravda“ a „Větvit na základě pravda/nepravda“. Při vytváření uzlu musíte vybrat jeden z těchto režimů a ten nelze později v konfiguraci uzlu změnit.

![Výběr režimu podmínky](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

V režimu „Pokračovat, pokud je pravda“, pokud je výsledek podmínky „pravda“, **pracovní postup** bude pokračovat v provádění následujících uzlů. V opačném případě se **pracovní postup** ukončí a předčasně se ukončí se stavem selhání.

![Režim „Pokračovat, pokud je pravda“](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Tento režim je vhodný pro scénáře, kdy **pracovní postup** nemá pokračovat, pokud podmínka není splněna. Například, tlačítko pro odeslání formuláře pro odeslání objednávky je navázáno na „událost před akcí“. Pokud je skladová zásoba produktu v objednávce nedostatečná, proces vytváření objednávky by neměl pokračovat, ale měl by selhat a ukončit se.

V režimu „Větvit na základě pravda/nepravda“ uzel podmínky vytvoří dvě následné větve, odpovídající výsledkům „pravda“ a „nepravda“ podmínky. Každá větev může být nakonfigurována s vlastními následnými uzly. Po dokončení provádění kterékoli větve se automaticky sloučí zpět do nadřazené větve uzlu podmínky, aby pokračovala v provádění následujících uzlů.

![Režim „Větvit na základě pravda/nepravda“](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Tento režim je vhodný pro scénáře, kdy je třeba provést různé akce v závislosti na tom, zda je podmínka splněna či nikoli. Například kontrola, zda určitá data existují: pokud neexistují, vytvořte je; pokud existují, aktualizujte je.

## Konfigurace uzlu

### Výpočetní engine

Aktuálně jsou podporovány tři enginy:

-   **Základní**: Získává logický výsledek pomocí jednoduchých binárních výpočtů a seskupení „AND“/„OR“.
-   **Math.js**: Počítá výrazy podporované enginem [Math.js](https://mathjs.org/) pro získání logického výsledku.
-   **Formula.js**: Počítá výrazy podporované enginem [Formula.js](https://formulajs.info/) pro získání logického výsledku.

Ve všech třech typech výpočtů lze jako parametry použít proměnné z kontextu **pracovního postupu**.