:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Používání proměnných

## Základní koncepty

Stejně jako proměnné v programovacích jazycích, i v **pracovních postupech** jsou **proměnné** důležitým nástrojem pro propojování a organizaci procesů.

Při spuštění pracovního postupu a následném vykonávání jednotlivých uzlů mohou některé konfigurační položky využívat proměnné. Zdrojem těchto proměnných jsou data z předchozích (upstream) uzlů aktuálního uzlu a zahrnují následující kategorie:

-   **Data kontextu spouštěče**: V případech, jako jsou spouštěče akcí nebo spouštěče kolekcí, může být objekt dat jednoho řádku použit jako proměnná všemi uzly. Specifika se liší v závislosti na implementaci každého spouštěče.
-   **Data z předchozích uzlů**: Když proces dosáhne libovolného uzlu, jedná se o výsledná data z dříve dokončených uzlů.
-   **Lokální proměnné**: Pokud se uzel nachází uvnitř speciálních větvících struktur, může využívat lokální proměnné specifické pro danou větev. Například v cyklické struktuře lze použít datový objekt každé iterace.
-   **Systémové proměnné**: Některé vestavěné systémové parametry, jako je aktuální čas.

Funkci proměnných jsme již několikrát použili v [Rychlém startu](../getting-started.md). Například v uzlu pro výpočet můžeme použít proměnné k odkazování na data kontextu spouštěče pro provádění výpočtů:

![Uzel pro výpočet používající funkce a proměnné](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

V uzlu pro aktualizaci použijte data kontextu spouštěče jako proměnnou pro podmínku filtru a odkazujte se na výsledek uzlu pro výpočet jako proměnnou pro hodnotu pole, které se má aktualizovat:

![Proměnné uzlu pro aktualizaci dat](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Datová struktura

Proměnná je interně struktura JSON a obvykle můžete použít konkrétní část dat pomocí její JSON cesty. Jelikož mnoho proměnných je založeno na struktuře kolekcí NocoBase, asociační data budou hierarchicky strukturována jako vlastnosti objektů, tvořící stromovou strukturu. Například můžeme vybrat hodnotu konkrétního pole z asociačních dat dotazovaných dat. Navíc, pokud mají asociační data strukturu typu 'jeden k mnoha' (to-many), proměnná může být pole.

Při výběru proměnné budete ve většině případů muset vybrat atribut hodnoty na poslední úrovni, což je obvykle jednoduchý datový typ, jako je číslo nebo řetězec. Pokud se však v hierarchii proměnné nachází pole, atribut na poslední úrovni bude také namapován na pole. Data pole lze správně zpracovat pouze v případě, že odpovídající uzel podporuje pole. Například v uzlu pro výpočet mají některé výpočetní enginy funkce speciálně pro práci s poli. Dalším příkladem je uzel pro cyklus, kde objekt cyklu může být také pole.

Například, když uzel pro dotazování dotazuje více dat, výsledek uzlu bude pole obsahující více řádků homogenních dat:

```json
[
  {
    "id": 1,
    "title": "Název 1"
  },
  {
    "id": 2,
    "title": "Název 2"
  }
]
```

Pokud jej však použijete jako proměnnou v následných uzlech a zvolená proměnná má formu `Data uzlu/Uzel dotazu/Název`, získáte pole namapované na odpovídající hodnoty polí:

```json
["Název 1", "Název 2"]
```

Pokud se jedná o vícerozměrné pole (například pole vztahu 'mnoho k mnoha'), získáte jednorozměrné pole s odpovídajícím zploštělým polem.

## Vestavěné systémové proměnné

### Systémový čas

Získá systémový čas v okamžiku provedení uzlu. Časové pásmo tohoto času je nastaveno na serveru.

### Parametry rozsahu dat

Lze použít při konfiguraci podmínek filtru pro datová pole v uzlech pro dotazování, aktualizaci a mazání. Podporováno je pouze pro porovnání „rovná se“. Počáteční a koncové časy rozsahu dat jsou založeny na časovém pásmu nastaveném na serveru.

![Parametry rozsahu dat](https://static-docs.nocobase.com/20240817175354.png)