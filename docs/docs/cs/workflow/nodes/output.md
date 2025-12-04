---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Výstup pracovního postupu

## Úvod

Uzel "Výstup pracovního postupu" slouží v volaném pracovním postupu k definování jeho výstupní hodnoty. Když je jeden pracovní postup volán jiným, lze pomocí uzlu "Výstup pracovního postupu" předat hodnotu zpět volajícímu.

## Vytvoření uzlu

V volaném pracovním postupu přidejte uzel "Výstup pracovního postupu":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Konfigurace uzlu

### Výstupní hodnota

Zadejte nebo vyberte proměnnou jako výstupní hodnotu. Výstupní hodnota může být libovolného typu, například konstanta (řetězec, číslo, logická hodnota, datum nebo vlastní JSON), nebo jiná proměnná z pracovního postupu.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Tip}
Pokud je do volaného pracovního postupu přidáno více uzlů "Výstup pracovního postupu", pak při volání tohoto pracovního postupu bude jako výstup použita hodnota posledního provedeného uzlu "Výstup pracovního postupu".
:::