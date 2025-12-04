:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled rozšíření bloků

V NocoBase 2.0 byl mechanismus rozšíření bloků výrazně zjednodušen. Vývojáři stačí zdědit odpovídající základní třídu **FlowModel** a implementovat související metody rozhraní (především metodu `renderComponent()`), aby mohli rychle přizpůsobit bloky.

## Kategorie bloků

NocoBase rozděluje bloky do tří typů, které jsou v konfiguračním rozhraní zobrazeny ve skupinách:

- **Datové bloky**: Bloky, které dědí z `DataBlockModel` nebo `CollectionBlockModel`.
- **Filtrační bloky**: Bloky, které dědí z `FilterBlockModel`.
- **Ostatní bloky**: Bloky, které přímo dědí z `BlockModel`.

> Zařazení bloku do skupiny je určeno odpovídající základní třídou. Logika klasifikace je založena na vztazích dědičnosti a nevyžaduje žádnou dodatečnou konfiguraci.

## Popis základních tříd

Systém poskytuje čtyři základní třídy pro rozšíření:

### BlockModel

**Základní model bloku**, nejuniverzálnější základní třída bloku.

- Vhodné pro bloky určené pouze k zobrazení, které nezávisí na datech.
- Je zařazen do skupiny **Ostatní bloky**.
- Použitelné pro personalizované scénáře.

### DataBlockModel

**Datový model bloku (není vázán na datovou tabulku)**, určený pro bloky s vlastním **zdrojem dat**.

- Není přímo vázán na datovou tabulku, umožňuje přizpůsobit logiku získávání dat.
- Je zařazen do skupiny **Datové bloky**.
- Použitelné pro: volání externích API, vlastní zpracování dat, statistické grafy a podobné scénáře.

### CollectionBlockModel

**Model bloku kolekce**, pro bloky, které je třeba navázat na datovou tabulku.

- Vyžaduje navázání na základní třídu modelu datové tabulky.
- Je zařazen do skupiny **Datové bloky**.
- Použitelné pro: seznamy, formuláře, kanban nástěnky a další bloky, které jasně závisí na konkrétní datové tabulce.

### FilterBlockModel

**Model filtračního bloku**, pro vytváření bloků s podmínkami filtru.

- Základní třída modelu pro vytváření podmínek filtru.
- Je zařazen do skupiny **Filtrační bloky**.
- Obvykle funguje ve spojení s datovými bloky.

## Jak vybrat základní třídu

Při výběru základní třídy se můžete řídit následujícími zásadami:

- **Potřebujete navázat na datovou tabulku**: Upřednostněte `CollectionBlockModel`.
- **Vlastní zdroj dat**: Zvolte `DataBlockModel`.
- **Pro nastavení podmínek filtru a spolupráci s datovými bloky**: Zvolte `FilterBlockModel`.
- **Nejste si jisti, jak zařadit**: Zvolte `BlockModel`.

## Rychlý start

Vytvoření vlastního bloku vyžaduje pouze tři kroky:

1. Zděděte odpovídající základní třídu (např. `BlockModel`).
2. Implementujte metodu `renderComponent()`, která vrátí React komponentu.
3. Zaregistrujte model bloku v **pluginu**.

Podrobné příklady naleznete v [Napsání pluginu pro blok](./write-a-block-plugin).