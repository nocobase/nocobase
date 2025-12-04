:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pole kolekce

## Typy rozhraní polí

NocoBase rozděluje pole z pohledu rozhraní do následujících kategorií:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Datové typy polí

Každé rozhraní pole (Field Interface) má výchozí datový typ. Například pro pole s rozhraním typu Číslo (Number) je výchozí datový typ double, ale může být také float, decimal atd. Aktuálně podporované datové typy jsou:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mapování typů polí

Proces přidávání nových polí do hlavní databáze je následující:

1. Vyberte typ rozhraní (Interface type).
2. Nakonfigurujte volitelný datový typ pro aktuální rozhraní.

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Proces mapování polí z externích zdrojů dat je:

1. Automaticky namapujte odpovídající datový typ (Field type) a typ UI (Field Interface) na základě typu pole externí databáze.
2. Podle potřeby upravte na vhodnější datový typ a typ rozhraní (Interface type).

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)