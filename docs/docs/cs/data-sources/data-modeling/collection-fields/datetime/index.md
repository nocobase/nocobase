:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

## Typy polí Datum a čas

Typy polí Datum a čas lze kategorizovat následovně:

- **Datum a čas (s časovou zónou)** – Tyto hodnoty se standardizují na UTC (koordinovaný světový čas) a v případě potřeby se upravují podle časové zóny.
- **Datum a čas (bez časové zóny)** – Tento typ ukládá data a časy bez informací o časové zóně.
- **Datum (bez času)** – Tento formát ukládá výhradně informaci o datu, bez časové složky.
- **Čas** – Ukládá pouze informaci o čase, bez data.
- **Unixový časový údaj (timestamp)** – Tento typ reprezentuje počet sekund, které uplynuly od 1. ledna 1970, a ukládá se jako Unixový časový údaj.

Zde jsou příklady pro jednotlivé typy polí souvisejících s datem a časem:

| **Typ pole**                  | **Příklad hodnoty**        | **Popis**                                      |
|-------------------------------|----------------------------|------------------------------------------------|
| Datum a čas (s časovou zónou) | 2024-08-24T07:30:00.000Z   | Převedeno na UTC a lze upravit pro časové zóny |
| Datum a čas (bez časové zóny) | 2024-08-24 15:30:00        | Ukládá datum a čas bez ohledu na časovou zónu  |
| Datum (bez času)              | 2024-08-24                 | Zachycuje pouze datum, bez informací o čase    |
| Čas                           | 15:30:00                   | Zachycuje pouze čas, bez podrobností o datu   |
| Unixový časový údaj           | 1724437800                 | Představuje sekundy od 1970-01-01 00:00:00 UTC |

## Srovnání zdrojů dat

Níže je srovnávací tabulka pro NocoBase, MySQL a PostgreSQL:

| **Typ pole**                  | **NocoBase**              | **MySQL**                  | **PostgreSQL**                        |
|-------------------------------|---------------------------|----------------------------|---------------------------------------|
| Datum a čas (s časovou zónou) | Datetime with timezone    | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE              |
| Datum a čas (bez časové zóny) | Datetime without timezone | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE           |
| Datum (bez času)              | Date                      | DATE                       | DATE                                  |
| Čas                           | Time                      | TIME                       | TIME WITHOUT TIME ZONE                |
| Unixový časový údaj           | Unix timestamp            | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                    |
| Čas (s časovou zónou)         | -                         | -                          | TIME WITH TIME ZONE                   |

**Poznámka:**
- Typ `TIMESTAMP` v MySQL pokrývá rozsah mezi UTC `1970-01-01 00:00:01` a `2038-01-19 03:14:07`. Pro data a časy mimo tento rozsah se doporučuje použít `DATETIME` nebo `BIGINT` pro uložení Unixových časových údajů.

## Proces ukládání dat a času

### S časovou zónou

Zahrnuje `Datum a čas (s časovou zónou)` a `Unixový časový údaj`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Poznámka:**
- Pro podporu širšího rozsahu dat používá NocoBase v MySQL pro pole Datum a čas (s časovou zónou) typ `DATETIME`. Uložená hodnota data je převedena na základě proměnné prostředí TZ serveru, což znamená, že pokud se proměnná prostředí TZ změní, změní se i uložená hodnota data a času.
- Vzhledem k rozdílu časových zón mezi UTC a lokálním časem by přímé zobrazení původní hodnoty UTC mohlo vést k nedorozumění uživatelů.

### Bez časové zóny

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time – koordinovaný světový čas) je globální časový standard, který se používá k celosvětové koordinaci a synchronizaci času. Jedná se o vysoce přesný časový standard, udržovaný atomovými hodinami a synchronizovaný s rotací Země.

Rozdíl mezi UTC a lokálním časem může způsobit zmatek při přímém zobrazení původních hodnot UTC. Například:

| **Časová zóna** | **Datum a čas**                   |
|-----------------|-----------------------------------|
| UTC             | 2024-08-24T07:30:00.000Z          |
| UTC+8           | 2024-08-24 15:30:00               |
| UTC+5           | 2024-08-24 12:30:00               |
| UTC-5           | 2024-08-24 02:30:00               |
| UTC+0           | 2024-08-24 07:30:00               |
| UTC-6           | 2024-08-23 01:30:00               |

Všechny výše uvedené časy představují stejný okamžik, pouze vyjádřený v různých časových zónách.