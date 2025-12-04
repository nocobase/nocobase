:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Výpočet

Uzel Výpočet dokáže vyhodnotit výraz a jeho výsledek se uloží do výsledku odpovídajícího uzlu pro použití dalšími uzly. Jedná se o nástroj pro výpočet, zpracování a transformaci dat. Do jisté míry může nahradit volání funkce na hodnotu a přiřazení výsledku proměnné, což je běžná operace v programovacích jazycích.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku, čímž přidáte uzel „Výpočet“:

![Uzel Výpočet_Přidat](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Konfigurace uzlu

![Uzel Výpočet_Konfigurace](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Výpočetní engine

Výpočetní engine definuje syntaxi podporovanou výrazem. Aktuálně podporované výpočetní enginy jsou [Math.js](https://mathjs.org/) a [Formula.js](https://formulajs.info/). Každý engine má vestavěné velké množství běžných funkcí a metod pro práci s daty. Konkrétní použití naleznete v jejich oficiální dokumentaci.

:::info{title=Tip}
Je třeba poznamenat, že různé enginy se liší v přístupu k indexům pole. Indexy Math.js začínají od `1`, zatímco Formula.js od `0`.
:::

Pokud navíc potřebujete jednoduché zřetězení řetězců, můžete přímo použít „Šablonu řetězce“. Tento engine nahradí proměnné ve výrazu jejich odpovídajícími hodnotami a poté vrátí zřetězený řetězec.

### Výraz

Výraz je řetězcová reprezentace výpočetního vzorce, který se může skládat z proměnných, konstant, operátorů a podporovaných funkcí. Můžete použít proměnné z kontextu pracovního postupu, například výsledek předchozího uzlu uzlu Výpočet, nebo lokální proměnné cyklu.

Pokud vstup výrazu neodpovídá syntaxi, zobrazí se v konfiguraci uzlu chyba. Pokud během provádění proměnná neexistuje, typ se neshoduje, nebo je použita neexistující funkce, uzel Výpočet se předčasně ukončí se stavem chyby.

## Příklad

### Výpočet celkové ceny objednávky

Objednávka obvykle může obsahovat více položek, přičemž každá položka má jinou cenu a množství. Celková cena objednávky musí být součtem součinů ceny a množství všech položek. Po načtení seznamu detailů objednávky (datová sada s relací jedna k mnoha) můžete použít uzel Výpočet k výpočtu celkové ceny objednávky:

![Uzel Výpočet_Příklad_Konfigurace](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Zde funkce `SUMPRODUCT` z Formula.js dokáže vypočítat součet součinů pro dvě pole stejné délky, což vede k celkové ceně objednávky.