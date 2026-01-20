---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# SQL operace

## Úvod

Ve specifických scénářích, kdy jednoduché uzly pro operace s kolekcemi nemusí zvládnout složité operace, můžete přímo použít uzel SQL, aby databáze přímo prováděla složité SQL příkazy pro manipulaci s daty.

Rozdíl oproti přímému připojení k databázi a provádění SQL operací mimo aplikaci spočívá v tom, že v rámci pracovního postupu můžete použít proměnné z kontextu procesu jako parametry v SQL příkazu.

## Instalace

Vestavěný plugin, nevyžaduje instalaci.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku pro přidání uzlu „SQL operace“:

![Přidat SQL operaci](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Konfigurace uzlu

![Uzel SQL_Konfigurace uzlu](https://static-docs.nocobase.com/20240904002334.png)

### Zdroj dat

Vyberte zdroj dat pro provedení SQL.

Zdroj dat musí být databázového typu, například hlavní zdroj dat, typ PostgreSQL nebo jiné zdroje dat kompatibilní se Sequelize.

### Obsah SQL

Upravte SQL příkaz. V současné době je podporován pouze jeden SQL příkaz.

Potřebné proměnné vložte pomocí tlačítka proměnné v pravém horním rohu editoru. Před spuštěním budou tyto proměnné nahrazeny svými odpovídajícími hodnotami pomocí textové substituce. Výsledný text bude poté použit jako konečný SQL příkaz a odeslán do databáze k dotazování.

## Výsledek provedení uzlu

Od verze `v1.3.15-beta` je výsledek provedení uzlu SQL polem čistých dat. Předtím to byla nativní návratová struktura Sequelize obsahující metadata dotazu (viz: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Například následující dotaz:

```sql
select count(id) from posts;
```

Výsledek před `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Výsledek po `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Často kladené otázky

### Jak použít výsledek uzlu SQL?

Pokud je použit příkaz `SELECT`, výsledek dotazu bude uložen v uzlu ve formátu JSON Sequelize. Může být analyzován a použit s [pluginem JSON-query](./json-query.md).

### Spouští SQL operace události kolekcí?

**Ne**. SQL operace přímo odesílá SQL příkaz do databáze ke zpracování. Související operace `CREATE` / `UPDATE` / `DELETE` probíhají v databázi, zatímco události kolekcí probíhají na aplikační vrstvě Node.js (zpracováváno ORM), proto nebudou události kolekcí spuštěny.