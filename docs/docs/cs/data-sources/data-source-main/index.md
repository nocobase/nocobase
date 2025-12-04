---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Hlavní databáze

## Úvod

Hlavní databáze NocoBase slouží k ukládání jak obchodních dat, tak metadat aplikace, včetně dat systémových tabulek a vlastních tabulek. Hlavní databáze podporuje relační databáze, jako jsou MySQL, PostgreSQL a další. Při instalaci aplikace NocoBase musí být hlavní databáze nainstalována souběžně a nelze ji odstranit.

## Instalace

Jedná se o vestavěný plugin, který nevyžaduje samostatnou instalaci.

## Správa kolekcí

Hlavní zdroj dat nabízí kompletní funkce pro správu kolekcí. Můžete vytvářet nové tabulky přímo v NocoBase nebo synchronizovat existující struktury tabulek z databáze.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Synchronizace existujících tabulek z databáze

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Důležitou funkcí hlavního zdroje dat je možnost synchronizovat tabulky, které již v databázi existují, do NocoBase pro jejich správu. To znamená:

- **Ochrana stávajících investic**: Pokud již máte v databázi velké množství obchodních tabulek, nemusíte je znovu vytvářet – můžete je přímo synchronizovat a používat.
- **Flexibilní integrace**: Tabulky vytvořené jinými nástroji (např. SQL skripty, nástroje pro správu databází atd.) lze spravovat v rámci NocoBase.
- **Postupná migrace**: Podpora postupné migrace stávajících systémů do NocoBase namísto jednorázové refaktorizace.

Pomocí funkce „Načíst z databáze“ můžete:
1. Procházet všechny tabulky v databázi
2. Vybrat tabulky, které chcete synchronizovat
3. Automaticky identifikovat struktury tabulek a typy polí
4. Importovat je do NocoBase pro správu jediným kliknutím.

### Podpora více typů kolekcí

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase podporuje vytváření a správu různých typů kolekcí:
- **Obecná kolekce**: obsahuje vestavěná běžně používaná systémová pole;
- **Dědičná kolekce**: umožňuje vytvoření rodičovské tabulky, ze které lze odvodit podřízené tabulky. Podřízené tabulky dědí strukturu rodičovské tabulky a mohou definovat vlastní sloupce.
- **Stromová kolekce**: tabulka se stromovou strukturou, v současné době podporuje pouze návrh seznamu sousedství;
- **Kalendářová kolekce**: pro vytváření tabulek událostí souvisejících s kalendářem;
- **Souborová kolekce**: pro správu úložiště souborů;
- **Kolekce výrazů**: pro scénáře dynamických výrazů v pracovních postupech;
- **SQL kolekce**: není skutečnou databázovou tabulkou, ale rychle strukturovaně zobrazuje SQL dotazy;
- **Kolekce databázových pohledů**: připojuje se k existujícím databázovým pohledům;
- **FDW kolekce**: umožňuje databázovému systému přímo přistupovat a dotazovat se na data v externích zdrojích dat, založeno na technologii FDW;

### Podpora kategorizované správy kolekcí

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Bohatá nabídka typů polí

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexibilní konverze typů polí

NocoBase podporuje flexibilní konverzi typů polí v rámci stejného typu databáze.

**Příklad: Možnosti konverze pro pole typu String**

Když je pole v databázi typu String, lze jej v NocoBase převést do kterékoli z následujících forem:

- **Základní**: Jednořádkový text, Víceřádkový text, Telefon, E-mail, URL, Heslo, Barva, Ikona
- **Výběr**: Jednoduchý výběr, Skupina přepínačů
- **Média**: Markdown, Markdown (Vditor), Formátovaný text, Příloha (URL)
- **Datum a čas**: Datum a čas (s časovou zónou), Datum a čas (bez časové zóny)
- **Pokročilé**: Sekvence, Selektor kolekce, Šifrování

Tento flexibilní mechanismus konverze znamená:
- **Není nutná úprava struktury databáze**: Podkladový typ úložiště pole zůstává nezměněn; mění se pouze jeho reprezentace v NocoBase.
- **Přizpůsobení obchodním změnám**: S vývojem obchodních potřeb můžete rychle upravovat způsob zobrazení a interakce s poli.
- **Bezpečnost dat**: Proces konverze neovlivňuje integritu stávajících dat.

### Flexibilní synchronizace na úrovni polí

NocoBase nesynchronizuje pouze celé tabulky, ale podporuje také detailní správu synchronizace na úrovni jednotlivých polí:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Funkce synchronizace polí:

1. **Synchronizace v reálném čase**: Když se změní struktura databázové tabulky, nově přidaná pole lze kdykoli synchronizovat.
2. **Selektivní synchronizace**: Můžete selektivně synchronizovat pouze potřebná pole, nikoli všechna.
3. **Automatické rozpoznání typu**: Automaticky identifikuje typy databázových polí a mapuje je na typy polí NocoBase.
4. **Zachování integrity dat**: Proces synchronizace neovlivňuje existující data.

#### Případy použití:

- **Evoluce databázového schématu**: Když se změní obchodní požadavky a je třeba přidat nová pole do databáze, lze je rychle synchronizovat do NocoBase.
- **Týmová spolupráce**: Když jiní členové týmu nebo DBA přidají pole do databáze, lze je okamžitě synchronizovat.
- **Hybridní režim správy**: Některá pole jsou spravována přes NocoBase, jiná tradičními metodami – flexibilní kombinace.

Tento flexibilní synchronizační mechanismus umožňuje NocoBase dobře se integrovat do stávajících technických architektur, aniž by vyžadoval změny stávajících postupů správy databází, a zároveň si užívat pohodlí low-code vývoje, které NocoBase nabízí.

Více se dozvíte v kapitole [Pole kolekcí / Přehled](/data-sources/data-modeling/collection-fields).