:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Kolekce výrazů

## Vytvoření šablonové kolekce „Výraz“

Než začnete v pracovním postupu používat uzly pro operace s dynamickými výrazy, je nejprve nutné vytvořit šablonovou kolekci „Výraz“ pomocí nástroje pro správu kolekcí. Tato kolekce slouží jako úložiště pro různé výrazy:

![Vytvoření kolekce výrazů](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Zadávání dat výrazů

Poté můžete nastavit blok tabulky a zadat několik záznamů vzorců do šablonové kolekce. Každý řádek v šablonové kolekci „Výraz“ lze chápat jako pravidlo výpočtu navržené pro konkrétní datový model v rámci kolekce. Můžete použít různá pole z datových modelů různých kolekcí jako proměnné a vytvářet jedinečné výrazy jako pravidla výpočtu. Kromě toho můžete podle potřeby využívat různé výpočetní enginy.

![Zadávání dat výrazů](https://static-docs.nocobase.com/761047f8daabacccbc6a24a73564093.png)

:::info{title=Tip}
Jakmile jsou vzorce vytvořeny, je potřeba je propojit s obchodními daty. Přímé spojování každého řádku obchodních dat s daty vzorců může být zdlouhavé, proto se běžně používá přístup, kdy se metadata kolekce, podobná klasifikační kolekci, použije k vytvoření vztahu mnoho-k-jednomu (nebo jedna-k-jednomu) s kolekcí vzorců. Následně jsou obchodní data spojena s klasifikovanými metadaty ve vztahu mnoho-k-jednomu. Tento přístup Vám umožňuje jednoduše specifikovat relevantní klasifikovaná metadata při vytváření obchodních dat, což usnadňuje nalezení a použití odpovídajících dat vzorců prostřednictvím vytvořené cesty propojení.
:::

## Načítání relevantních dat do procesu

Jako příklad si vezměte vytvoření pracovního postupu spouštěného událostí kolekce. Při vytvoření objednávky by měl spouštěč přednačíst související data produktů spolu s daty výrazů souvisejících s produkty:

![Událost kolekce_Konfigurace spouštěče](https://static-docs.nocobase.com/f75b10007afd5de068f3458d2e04.png)