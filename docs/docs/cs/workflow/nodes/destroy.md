:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Smazat data

Slouží ke smazání dat z kolekce, která splňují určité podmínky.

Základní použití uzlu pro smazání dat je podobné jako u uzlu pro aktualizaci dat, s tím rozdílem, že uzel pro smazání dat nevyžaduje přiřazení polí. Stačí pouze vybrat kolekci a zadat podmínky filtru. Výsledkem uzlu pro smazání dat je počet úspěšně smazaných řádků, který je viditelný pouze v historii spuštění a nelze jej použít jako proměnnou v následných uzlech.

:::info{title=Upozornění}
V současné době uzel pro smazání dat nepodporuje mazání po jednotlivých řádcích; provádí pouze hromadné mazání. Proto nespustí žádné další události pro smazání každého jednotlivého datového záznamu.
:::

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „Smazat data“:

![Vytvoření uzlu pro smazání dat](https://static-docs.nocobase.com/e1b6b8728251fcdbed6c7f50e5570da2.png)

## Konfigurace uzlu

![Uzel pro smazání dat_Konfigurace uzlu](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Kolekce

Vyberte kolekci, ze které chcete smazat data.

### Podmínky filtru

Podobně jako u podmínek filtru pro běžné dotazy na kolekce můžete použít kontextové proměnné pracovního postupu.

## Příklad

Například pro pravidelné čištění zrušených a neplatných historických dat objednávek můžete použít uzel pro smazání dat:

![Uzel pro smazání dat_Příklad_Konfigurace uzlu](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Pracovní postup se bude spouštět pravidelně a provede smazání všech zrušených a neplatných historických dat objednávek.