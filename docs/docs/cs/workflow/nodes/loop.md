---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Cyklus

## Úvod

Cyklus je ekvivalentní programovacím konstrukcím jako `for`/`while`/`forEach`. Pokud potřebujete opakovaně provést určité operace po daný počet opakování nebo pro určitou datovou kolekci (pole), můžete použít uzel cyklu.

## Instalace

Jedná se o vestavěný plugin, který nevyžaduje instalaci.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „Cyklus“:

![Vytvoření uzlu cyklu](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Po vytvoření uzlu cyklu se vygeneruje vnitřní větev cyklu. Do této větve můžete přidat libovolný počet uzlů. Tyto uzly mohou kromě proměnných z kontextu pracovního postupu používat také lokální proměnné z kontextu cyklu, například datový objekt, který je v každé iteraci cyklu zpracováván z kolekce, nebo index počtu opakování (index začíná od `0`). Rozsah platnosti lokálních proměnných je omezen pouze na vnitřek cyklu. Pokud existuje vícenásobné vnoření cyklů, můžete pro každou úroveň použít specifické lokální proměnné cyklu.

## Konfigurace uzlu

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Objekt cyklu

Cyklus zpracovává různé datové typy objektu cyklu odlišně:

1.  **Pole**: Toto je nejčastější případ. Obvykle můžete vybrat proměnnou z kontextu pracovního postupu, například více datových výsledků z uzlu dotazu, nebo předem načtená data vztahu jedna k mnoha. Pokud je vybráno pole, uzel cyklu projde každý prvek v poli a při každé iteraci přiřadí aktuální prvek lokální proměnné v kontextu cyklu.

2.  **Číslo**: Pokud je vybraná proměnná číslo, bude použito jako počet iterací. Hodnota čísla musí být kladné celé číslo; záporná čísla cyklus nespustí a desetinná část desetinného čísla bude ignorována. Index počtu opakování v lokální proměnné je také hodnota objektu cyklu. Tato hodnota začíná od **0**. Například, pokud je objekt cyklu číslo 5, objekt a index v každé iteraci budou postupně: 0, 1, 2, 3, 4.

3.  **Řetězec**: Pokud je vybraná proměnná řetězec, jeho délka bude použita jako počet iterací, přičemž každý znak řetězce bude zpracován podle indexu.

4.  **Jiné**: Jiné typy hodnot (včetně typů objektů) jsou považovány za objekt cyklu s jednou položkou a budou se opakovat pouze jednou. V takovém případě obvykle není potřeba cyklus používat.

Kromě výběru proměnné můžete také přímo zadat konstanty pro číselné a řetězcové typy. Například zadáním `5` (číselný typ) se uzel cyklu zopakuje 5krát. Zadáním `abc` (řetězcový typ) se uzel cyklu zopakuje 3krát a zpracuje znaky `a`, `b` a `c` postupně. V nástroji pro výběr proměnných zvolte požadovaný typ pro konstantu.

### Podmínka cyklu

Od verze `v1.4.0-beta` byly přidány možnosti související s podmínkami cyklu. Podmínky cyklu můžete povolit v konfiguraci uzlu.

**Podmínka**

Podobně jako konfigurace podmínek v uzlu podmínky, můžete kombinovat konfigurace a používat proměnné z aktuálního cyklu, jako je objekt cyklu, index cyklu atd.

**Načasování kontroly**

Podobně jako u konstrukcí `while` a `do/while` v programovacích jazycích můžete zvolit vyhodnocení nakonfigurované podmínky před každým spuštěním cyklu nebo po jeho skončení. Vyhodnocení podmínky po cyklu umožňuje nejprve provést ostatní uzly uvnitř těla cyklu a teprve poté provést kontrolu podmínky.

**Při nesplnění podmínky**

Podobně jako u příkazů `break` a `continue` v programovacích jazycích můžete zvolit ukončení cyklu nebo pokračování v další iteraci.

### Zpracování chyb v uzlech uvnitř cyklu

Od verze `v1.4.0-beta` platí, že pokud uzel uvnitř cyklu selže (např. kvůli nesplněným podmínkám, chybám atd.), můžete nakonfigurovat následný tok. Podporovány jsou tři způsoby zpracování:

*   Ukončit pracovní postup (jako `throw` v programování)
*   Ukončit cyklus a pokračovat v pracovním postupu (jako `break` v programování)
*   Pokračovat k dalšímu objektu cyklu (jako `continue` v programování)

Výchozí nastavení je „Ukončit pracovní postup“, které lze podle potřeby změnit.

## Příklad

Představte si například, že při zadávání objednávky je potřeba zkontrolovat skladovou dostupnost každého produktu v objednávce. Pokud je sklad dostatečný, odečte se ze skladu; v opačném případě se produkt v detailu objednávky označí jako neplatný.

1.  Vytvořte tři kolekce: Produkty <-(1:m)-- Detaily objednávky --(m:1)-> Objednávky. Datový model je následující:

    **Kolekce Objednávky**
    | Název pole     | Typ pole       |
    | -------------- | -------------- |
    | Detaily objednávky | Jedna k mnoha (Detaily objednávky) |
    | Celková cena objednávky | Číslo           |

    **Kolekce Detaily objednávky**
    | Název pole | Typ pole       |
    | -------- | -------------- |
    | Produkt     | Mnoho k jedné (Produkt) |
    | Množství     | Číslo           |

    **Kolekce Produkty**
    | Název pole | Typ pole |
    | -------- | -------- |
    | Název produktu | Jednořádkový text |
    | Cena     | Číslo     |
    | Sklad     | Celé číslo     |

2.  Vytvořte pracovní postup. Jako spouštěč vyberte „Událost kolekce“ a zvolte kolekci „Objednávky“, aby se spustil „Po přidání záznamu“. Dále je potřeba nakonfigurovat přednačtení dat vztahů kolekce „Detaily objednávky“ a kolekce Produkty pod detaily:

    ![Uzel cyklu_Příklad_Konfigurace spouštěče](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Vytvořte uzel cyklu a jako objekt cyklu vyberte „Spouštěcí data / Detaily objednávky“, což znamená, že se zpracuje každý záznam v kolekci Detaily objednávky:

    ![Uzel cyklu_Příklad_Konfigurace uzlu cyklu](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Uvnitř uzlu cyklu vytvořte uzel „Podmínka“, který zkontroluje, zda je skladová dostupnost produktu dostatečná:

    ![Uzel cyklu_Příklad_Konfigurace uzlu podmínky](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Pokud je sklad dostatečný, vytvořte ve větvi „Ano“ uzel „Výpočet“ a uzel „Aktualizovat záznam“, které aktualizují odpovídající záznam produktu s vypočteným odečteným skladem:

    ![Uzel cyklu_Příklad_Konfigurace uzlu výpočtu](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Uzel cyklu_Příklad_Konfigurace uzlu aktualizace skladu](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  V opačném případě vytvořte ve větvi „Ne“ uzel „Aktualizovat záznam“, který aktualizuje stav detailu objednávky na „neplatný“:

    ![Uzel cyklu_Příklad_Konfigurace uzlu aktualizace detailu objednávky](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Celková struktura pracovního postupu je následující:

![Uzel cyklu_Příklad_Struktura pracovního postupu](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Po dokončení konfigurace a aktivaci tohoto pracovního postupu se při vytvoření nové objednávky automaticky zkontroluje skladová dostupnost produktů v detailech objednávky. Pokud je sklad dostatečný, bude odečten; v opačném případě se produkt v detailu objednávky aktualizuje na neplatný (aby bylo možné vypočítat platnou celkovou cenu objednávky).