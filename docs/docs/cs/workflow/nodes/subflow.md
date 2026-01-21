---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Volání pracovního postupu

## Úvod

Slouží k volání jiných pracovních postupů z jednoho pracovního postupu. Můžete použít proměnné z aktuálního pracovního postupu jako vstup pro dílčí pracovní postup a výstup dílčího pracovního postupu pak využít jako proměnné v aktuálním pracovním postupu pro následné uzly.

Proces volání pracovního postupu je znázorněn na obrázku níže:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Voláním pracovních postupů můžete znovu použít běžnou logiku procesů, jako je odesílání e-mailů, SMS zpráv apod., nebo rozdělit složitý pracovní postup na více dílčích pracovních postupů pro snazší správu a údržbu.

V podstatě pracovní postupy nerozlišují, zda je daný proces dílčím pracovním postupem. Jakýkoli pracovní postup může být volán jako dílčí pracovní postup jinými pracovními postupy a zároveň může volat i jiné pracovní postupy. Všechny pracovní postupy jsou si rovny; existuje pouze vztah volání a být volán.

Podobně se volání pracovního postupu používá na dvou místech:

1.  **V hlavním pracovním postupu**: Jako volající strana, která prostřednictvím uzlu „Volat pracovní postup“ volá jiné pracovní postupy.
2.  **V dílčím pracovním postupu**: Jako volaná strana, která prostřednictvím uzlu „Výstup pracovního postupu“ ukládá proměnné, jež je třeba z aktuálního pracovního postupu vyvést. Tyto proměnné pak mohou být použity následnými uzly v pracovním postupu, který jej volal.

## Vytvoření uzlu

V konfiguračním rozhraní pracovního postupu klikněte na tlačítko plus („+“) v pracovním postupu a přidejte uzel „Volat pracovní postup“:

![Přidat uzel Volat pracovní postup](https://static-docs.nocobase.com/20241230001323.png)

## Konfigurace uzlu

### Výběr pracovního postupu

Vyberte pracovní postup, který chcete volat. Pro rychlé vyhledání můžete použít vyhledávací pole:

![Vybrat pracovní postup](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Tip}
*   Neaktivní pracovní postupy mohou být také volány jako dílčí pracovní postupy.
*   Pokud je aktuální pracovní postup v synchronním režimu, může volat pouze dílčí pracovní postupy, které jsou rovněž v synchronním režimu.
:::

### Konfigurace proměnných spouštěče pracovního postupu

Po výběru pracovního postupu je také nutné nakonfigurovat proměnné spouštěče jako vstupní data pro spuštění dílčího pracovního postupu. Můžete přímo vybrat statická data nebo zvolit proměnné z aktuálního pracovního postupu:

![Konfigurace proměnných spouštěče](https://static-docs.nocobase.com/20241230162722.png)

Různé typy spouštěčů vyžadují různé proměnné, které lze podle potřeby nakonfigurovat ve formuláři.

## Uzel výstupu pracovního postupu

Viz obsah uzlu [Výstup pracovního postupu](./output.md) pro konfiguraci výstupních proměnných dílčího pracovního postupu.

## Použití výstupu pracovního postupu

Zpět v hlavním pracovním postupu, v ostatních uzlech pod uzlem „Volat pracovní postup“, když chcete použít výstupní hodnotu dílčího pracovního postupu, můžete vybrat výsledek uzlu „Volat pracovní postup“. Pokud dílčí pracovní postup vrací jednoduchou hodnotu, jako je řetězec, číslo, logická hodnota, datum (datum je řetězec ve formátu UTC) atd., lze ji použít přímo. Pokud se jedná o složitý objekt (například objekt z kolekce), je třeba jej nejprve namapovat pomocí uzlu pro parsování JSON, než bude možné použít jeho vlastnosti; jinak jej lze použít pouze jako celý objekt.

Pokud dílčí pracovní postup nemá nakonfigurovaný uzel výstupu pracovního postupu, nebo pokud nemá žádnou výstupní hodnotu, pak při použití výsledku uzlu „Volat pracovní postup“ v hlavním pracovním postupu získáte pouze prázdnou hodnotu (`null`).