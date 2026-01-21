---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Mnoho k mnoha (pole)

## Úvod

Tato funkce Vám umožňuje použít pole typu pole v kolekci dat k uložení více unikátních klíčů z cílové tabulky, a tím vytvořit vztah mnoho k mnoha mezi těmito dvěma tabulkami. Například si představte entity Články a Štítky. Jeden článek může být propojen s více štítky, přičemž tabulka článků ukládá ID odpovídajících záznamů z tabulky štítků do pole.

:::warning{title=Poznámka}

- Kdykoli je to možné, doporučujeme použít spojovací kolekci k vytvoření standardního vztahu [mnoho k mnoha](../data-modeling/collection-fields/associations/m2m/index.md) namísto spoléhání se na tuto metodu.
- V současné době pouze PostgreSQL podporuje filtrování dat zdrojové kolekce pomocí polí z cílové tabulky pro vztahy mnoho k mnoha vytvořené s poli typu pole. Například ve výše uvedeném scénáři můžete filtrovat články na základě jiných polí v tabulce štítků, jako je název.

  :::

### Konfigurace pole

![Konfigurace pole mnoho k mnoha (pole)](https://static-docs.nocobase.com/202407051108180.png)

## Popis parametrů

### Zdrojová kolekce

Zdrojová kolekce, ve které se aktuální pole nachází.

### Cílová kolekce

Cílová kolekce, se kterou je vztah navázán.

### Cizí klíč

Pole typu pole ve zdrojové kolekci, které ukládá cílový klíč z cílové tabulky.

Odpovídající vztahy pro typy polí jsou následující:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Cílový klíč

Pole v cílové kolekci, které odpovídá hodnotám uloženým v poli typu pole zdrojové tabulky. Toto pole musí být unikátní.