:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/blocks/block-settings/drag-sort).
:::

# Sortowanie metodą przeciągnij i upuść

## Wprowadzenie

Sortowanie metodą „przeciągnij i upuść” opiera się na polu sortowania i służy do ręcznego zmieniania kolejności rekordów w bloku.


:::info{title=Wskazówka}
* Gdy to samo pole sortowania jest używane do sortowania w wielu blokach jednocześnie, może to zakłócić istniejącą kolejność.
* Podczas korzystania z sortowania w tabeli, pole sortowania nie może mieć skonfigurowanych reguł grupowania.
* Tabele drzewiaste obsługują sortowanie węzłów wyłącznie w obrębie tego samego poziomu.

:::


## Konfiguracja

Należy dodać pole typu „Sortowanie” (Sort). Pola sortowania nie są już generowane automatycznie podczas tworzenia kolekcji; muszą zostać utworzone ręcznie.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Podczas włączania sortowania metodą przeciągnij i upuść dla tabeli, należy wybrać odpowiednie pole sortowania.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Sortowanie wierszy tabeli metodą przeciągnij i upuść


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Wyjaśnienie reguł sortowania

Załóżmy, że aktualna kolejność to:

```
[1,2,3,4,5,6,7,8,9]
```

Gdy element (np. 5) zostanie przesunięty do przodu na pozycję elementu 3, zmienią się tylko wartości sortowania dla 3, 4 i 5: element 5 zajmie miejsce 3, a elementy 3 i 4 przesuną się o jedną pozycję do tyłu.

```
[1,2,5,3,4,6,7,8,9]
```

Jeśli następnie przesuną Państwo element 6 do tyłu na pozycję elementu 8, element 6 zajmie miejsce 8, a elementy 7 i 8 przesuną się o jedną pozycję do przodu.

```
[1,2,5,3,4,7,8,6,9]
```