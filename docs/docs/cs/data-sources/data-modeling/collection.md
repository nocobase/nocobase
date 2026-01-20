:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled kolekcí

NocoBase nabízí jedinečný DSL pro popis struktury dat, známý jako kolekce. Tento DSL sjednocuje datové struktury z různých zdrojů a poskytuje spolehlivý základ pro správu, analýzu a aplikace dat.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Pro pohodlné používání různých datových modelů NocoBase podporuje vytváření různých typů kolekcí:

- [Obecná kolekce](/data-sources/data-source-main/general-collection): Obsahuje vestavěná běžná systémová pole;
- [Dědičná kolekce](/data-sources/data-source-main/inheritance-collection): Umožňuje vytvořit rodičovskou kolekci a z ní odvodit podřízenou kolekci. Podřízená kolekce zdědí strukturu rodičovské kolekce a zároveň si může definovat vlastní sloupce.
- [Stromová kolekce](/data-sources/collection-tree): Kolekce se stromovou strukturou, v současné době podporuje pouze návrh s adjacenčním seznamem;
- [Kalendářní kolekce](/data-sources/calendar/calendar-collection): Slouží k vytváření kolekcí událostí souvisejících s kalendářem;
- [Souborová kolekce](/data-sources/file-manager/file-collection): Slouží pro správu úložiště souborů;
- Používá se pro scénáře dynamických výrazů v pracovních postupech;
- [SQL kolekce](/data-sources/collection-sql): Není skutečnou databázovou kolekcí, ale rychle a strukturovaně prezentuje SQL dotazy;
- [Kolekce pohledů](/data-sources/collection-view): Připojuje se k existujícím databázovým pohledům;
- [Externí kolekce](/data-sources/collection-fdw): Umožňuje databázovému systému přímo přistupovat a dotazovat se na data v externích zdrojích dat, a to na základě technologie FDW.