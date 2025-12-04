:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

Datové modelování je klíčovým krokem při návrhu databází, zahrnující hloubkovou analýzu a abstrakci různých typů dat a jejich vzájemných vztahů v reálném světě. V tomto procesu se snažíme odhalit vnitřní souvislosti mezi daty a formalizovat je do datových modelů, čímž pokládáme základ pro databázovou strukturu informačního systému. NocoBase je platforma řízená datovými modely, která nabízí následující funkce:

## Podpora přístupu k datům z různých zdrojů

Zdrojem dat pro NocoBase mohou být běžné databáze, platformy API (SDK) a soubory.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase nabízí [správce zdrojů dat](/data-sources/data-source-manager) pro správu různých zdrojů dat a jejich kolekcí. Plugin správce zdrojů dat poskytuje pouze rozhraní pro správu všech zdrojů dat a sám o sobě neumožňuje přímý přístup k datům. Jeho použití vyžaduje kombinaci s různými pluginy pro konkrétní zdroje dat. Mezi aktuálně podporované zdroje dat patří:

- [Hlavní databáze](/data-sources/data-source-main): Hlavní databáze NocoBase, podporující relační databáze jako MySQL, PostgreSQL a MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Používá databázi KingbaseES jako zdroj dat, kterou lze použít jako hlavní i externí databázi.
- [Externí MySQL](/data-sources/data-source-external-mysql): Používá externí databázi MySQL jako zdroj dat.
- [Externí MariaDB](/data-sources/data-source-external-mariadb): Používá externí databázi MariaDB jako zdroj dat.
- [Externí PostgreSQL](/data-sources/data-source-external-postgres): Používá externí databázi PostgreSQL jako zdroj dat.
- [Externí MSSQL](/data-sources/data-source-external-mssql): Používá externí databázi MSSQL (SQL Server) jako zdroj dat.
- [Externí Oracle](/data-sources/data-source-external-oracle): Používá externí databázi Oracle jako zdroj dat.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Nabízí rozmanité nástroje pro datové modelování

**Jednoduché rozhraní pro správu kolekcí**: Slouží k vytváření různých modelů (kolekcí) nebo k připojení k již existujícím.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Vizuální rozhraní ve stylu ER diagramů**: Slouží k extrakci entit a jejich vztahů z uživatelských a obchodních požadavků. Poskytuje intuitivní a snadno srozumitelný způsob popisu datových modelů. Prostřednictvím ER diagramů můžete jasněji pochopit hlavní datové entity v systému a jejich vzájemné vztahy.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Podporuje různé typy kolekcí

| Kolekce | Popis |
| - | - |
| [Obecná kolekce](/data-sources/data-source-main/general-collection) | Obsahuje běžná systémová pole |
| [Kalendářová kolekce](/data-sources/calendar/calendar-collection) | Slouží k vytváření kolekcí událostí souvisejících s kalendářem |
| Kolekce komentářů | Slouží k ukládání komentářů nebo zpětné vazby k datům |
| [Stromová kolekce](/data-sources/collection-tree) | Stromově strukturovaná kolekce, v současnosti podporuje pouze model sousednosti |
| [Kolekce souborů](/data-sources/file-manager/file-collection) | Slouží ke správě úložiště souborů |
| [SQL kolekce](/data-sources/collection-sql) | Není skutečnou databázovou kolekcí, ale strukturovaně vizualizuje SQL dotazy |
| [Připojení k databázovému pohledu](/data-sources/collection-view) | Připojuje se k existujícím databázovým pohledům |
| Kolekce výrazů | Používá se pro scénáře dynamických výrazů v pracovních postupech |
| [Připojení k externím datům](/data-sources/collection-fdw) | Umožňuje databázovému systému přímo přistupovat a dotazovat se na data v externích zdrojích dat na základě technologie FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Více obsahu naleznete v kapitole „[Kolekce / Přehled](/data-sources/data-modeling/collection)“.

## Nabízí bohatou škálu typů polí

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Více obsahu naleznete v kapitole „[Pole kolekcí / Přehled](/data-sources/data-modeling/collection-fields)“.