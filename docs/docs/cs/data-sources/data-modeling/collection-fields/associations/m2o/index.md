:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vztah mnoho k jedné

V databázi knihovny máme dvě entity: knihy a autory. Jeden autor může napsat více knih, ale každá kniha má obvykle pouze jednoho autora. V takovém případě je vztah mezi autory a knihami typu mnoho k jedné. Více knih může být spojeno se stejným autorem, ale každá kniha může mít pouze jednoho autora.

ER diagram:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Konfigurace pole:

![alt text](https://static-docs.nocobase.com/3b484ebb98d82f832f3dbf752bd84c9.png)

## Popis parametrů

### Zdrojová kolekce

Zdrojová kolekce, tedy kolekce, ve které se aktuální pole nachází.

### Cílová kolekce

Cílová kolekce, tedy kolekce, se kterou se má provést propojení.

### Cizí klíč

Pole ve zdrojové kolekci, které se používá k navázání propojení mezi dvěma kolekcemi.

### Cílový klíč

Pole v cílové kolekci, na které odkazuje cizí klíč. Musí být unikátní.

### ON DELETE

ON DELETE odkazuje na pravidla, která se aplikují na reference cizích klíčů v souvisejících podřízených kolekcích při odstranění záznamů z nadřazené kolekce. Jedná se o volbu používanou při definování omezení cizího klíče. Běžné možnosti ON DELETE zahrnují:

- **CASCADE**: Při odstranění záznamu z nadřazené kolekce se automaticky odstraní všechny související záznamy v podřízené kolekci.
- **SET NULL**: Při odstranění záznamu z nadřazené kolekce se hodnoty cizích klíčů v souvisejících záznamech podřízené kolekce nastaví na NULL.
- **RESTRICT**: Výchozí volba, která zabraňuje odstranění záznamu z nadřazené kolekce, pokud existují související záznamy v podřízené kolekci.
- **NO ACTION**: Podobně jako RESTRICT zabraňuje odstranění záznamu z nadřazené kolekce, pokud existují související záznamy v podřízené kolekci.