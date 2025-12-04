---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Dědičná kolekce

## Úvod

:::warning
Podporováno pouze v případě, že je hlavní databáze PostgreSQL.
:::

Můžete vytvořit rodičovskou kolekci a z ní odvodit dětské kolekce. Dětská kolekce zdědí strukturu rodičovské kolekce a zároveň si může definovat vlastní sloupce. Tento návrhový vzor pomáhá organizovat a spravovat data s podobnou strukturou, která se však mohou v některých ohledech lišit.

Níže uvádíme některé běžné vlastnosti dědičných kolekcí:

- **Rodičovská kolekce:** Rodičovská kolekce obsahuje společné sloupce a data a definuje základní strukturu celé hierarchie dědičnosti.
- **Dětská kolekce:** Dětská kolekce zdědí strukturu rodičovské kolekce, ale může si navíc definovat vlastní sloupce. To umožňuje každé dětské kolekci mít společné vlastnosti rodičovské kolekce a zároveň obsahovat atributy specifické pro podtřídu.
- **Dotazování:** Při dotazování si můžete vybrat, zda budete dotazovat celou hierarchii dědičnosti, pouze rodičovskou kolekci, nebo konkrétní dětskou kolekci. To umožňuje získávat a zpracovávat data z různých úrovní podle potřeby.
- **Vztah dědičnosti:** Mezi rodičovskou a dětskou kolekcí je navázán vztah dědičnosti. To znamená, že strukturu rodičovské kolekce lze použít k definování konzistentních atributů, přičemž dětská kolekce může tyto atributy rozšířit nebo přepsat.

Tento návrhový vzor pomáhá snižovat redundanci dat, zjednodušovat databázový model a usnadňuje údržbu dat. Je však třeba jej používat s opatrností, protože dědičné kolekce mohou zvýšit složitost dotazů, zejména při práci s celou hierarchií dědičnosti. Databázové systémy, které podporují dědičné kolekce, obvykle poskytují specifickou syntaxi a nástroje pro správu a dotazování těchto struktur kolekcí.

## Uživatelská příručka

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)