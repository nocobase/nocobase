:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/blocks/block-settings/drag-sort).
:::

# Řazení přetažením

## Úvod

Řazení přetažením (drag-and-drop) závisí na poli typu řazení a slouží k ručnímu přeuspořádání záznamů v bloku.


:::info{title=Tip}
* Pokud je stejné pole pro řazení použito pro řazení přetažením ve více blocích, může dojít k narušení stávajícího pořadí.
* Při řazení přetažením v tabulce nesmí mít pole pro řazení nastavená pravidla pro seskupování.
* Stromové tabulky podporují pouze řazení uzlů v rámci stejné úrovně.

:::


## Konfigurace řazení

Přidejte pole typu „Řazení“ (Sort). Pole pro řazení se již při vytváření kolekce negenerují automaticky; je nutné je vytvořit ručně.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Při povolování řazení přetažením v tabulce musíte vybrat konkrétní pole pro řazení.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Řazení řádků tabulky přetažením


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Vysvětlení pravidel řazení

Předpokládejme, že aktuální pořadí je:

```
[1,2,3,4,5,6,7,8,9]
```

Pokud je prvek (například 5) přesunut vpřed na pozici prvku 3, změní se pouze hodnoty řazení u prvků 3, 4 a 5: prvek 5 obsadí pozici prvku 3 a prvky 3 a 4 se posunou o jednu pozici zpět.

```
[1,2,5,3,4,6,7,8,9]
```

Pokud následně přesunete prvek 6 zpět na pozici prvku 8, prvek 6 obsadí pozici prvku 8 a prvky 7 a 8 se posunou o jednu pozici vpřed.

```
[1,2,5,3,4,7,8,6,9]
```