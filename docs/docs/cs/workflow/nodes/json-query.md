---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# JSON Výpočet

## Úvod

Na základě různých JSON výpočetních enginů tento uzel počítá nebo transformuje komplexní JSON data generovaná předchozími uzly, aby je mohly využít následné uzly. Například výsledky SQL operací a uzlů HTTP požadavků lze pomocí tohoto uzlu transformovat do požadovaných hodnot a formátů proměnných pro další zpracování.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v procesu a přidejte uzel „JSON Výpočet“:

![Vytvoření uzlu](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Tip}
Uzel JSON Výpočet se obvykle vytváří pod jinými datovými uzly, aby je bylo možné analyzovat.
:::

## Konfigurace uzlu

### Parsovací engine

Uzel JSON Výpočet podporuje různé syntaxe prostřednictvím různých parsovacích enginů. Můžete si vybrat na základě svých preferencí a funkcí jednotlivých enginů. V současné době jsou podporovány tři parsovací enginy:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Výběr enginu](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Zdroj dat

Zdroj dat může být výsledek předchozího uzlu nebo datový objekt v kontextu pracovního postupu. Obvykle se jedná o datový objekt bez vestavěné struktury, například výsledek SQL uzlu nebo uzlu HTTP požadavku.

![Zdroj dat](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Tip}
Datové objekty uzlů souvisejících s kolekcemi jsou obvykle strukturovány pomocí konfiguračních informací kolekce a obecně není nutné je parsovat uzlem JSON Výpočet.
:::

### Parsovací výraz

Vlastní parsovací výrazy na základě požadavků na parsování a zvoleného parsovacího enginu.

![Parsovací výraz](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Tip}
Různé enginy poskytují různé parsovací syntaxe. Podrobnosti naleznete v dokumentaci na odkazech.
:::

Od verze `v1.0.0-alpha.15` výrazy podporují proměnné. Proměnné jsou před spuštěním konkrétního enginu předparsovány, přičemž se nahradí konkrétními řetězcovými hodnotami podle pravidel řetězcových šablon a spojí se s ostatními statickými řetězci ve výrazu, čímž se vytvoří konečný výraz. Tato funkce je velmi užitečná, když potřebujete dynamicky vytvářet výrazy, například když některý JSON obsah vyžaduje dynamický klíč pro parsování.

### Mapování vlastností

Když je výsledek výpočtu objekt (nebo pole objektů), můžete pomocí mapování vlastností dále mapovat požadované vlastnosti na podřízené proměnné pro použití následnými uzly.

![Mapování vlastností](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Tip}
Pro výsledek objektu (nebo pole objektů), pokud není provedeno mapování vlastností, bude celý objekt (nebo pole objektů) uložen jako jedna proměnná ve výsledku uzlu a hodnoty vlastností objektu nelze přímo použít jako proměnné.
:::

## Příklad

Předpokládejme, že data k parsování pocházejí z předchozího SQL uzlu, který sloužil k dotazování dat, a jehož výsledkem je sada dat objednávek:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Pokud potřebujeme analyzovat a vypočítat celkovou cenu dvou objednávek v datech a sestavit ji s odpovídajícím ID objednávky do objektu pro aktualizaci celkové ceny objednávky, můžeme ji nakonfigurovat následovně:

![Příklad - Konfigurace parsování SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Vyberte parsovací engine JSONata;
2. Vyberte výsledek SQL uzlu jako zdroj dat;
3. Použijte JSONata výraz `$[0].{"id": id, "total": products.(price * quantity)}` pro parsování;
4. Vyberte mapování vlastností pro mapování `id` a `total` na podřízené proměnné;

Konečný výsledek parsování je následující:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Poté projděte výsledné pole objednávek a aktualizujte celkovou cenu objednávek.

![Aktualizace celkové ceny odpovídající objednávky](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)