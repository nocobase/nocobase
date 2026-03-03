:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/blocks/block-settings/drag-sort).
:::

# Dra-och-släpp-sortering

## Introduktion

Dra-och-släpp-sortering förlitar sig på ett sorteringsfält för att manuellt ändra ordningen på poster inom ett block.


:::info{title=Tips}
* Om samma sorteringsfält används för dra-och-släpp-sortering i flera block kan det störa den befintliga ordningen.
* Vid dra-och-släpp-sortering i en tabell kan sorteringsfältet inte ha grupperingsregler konfigurerade.
* Trädtabeller stöder endast sortering av noder inom samma nivå.

:::


## Konfiguration

Lägg till ett fält av typen ”Sortering”. Sorteringsfält genereras inte längre automatiskt när ni skapar en samling; de måste skapas manuellt.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

När ni aktiverar dra-och-släpp-sortering för en tabell måste ni välja ett sorteringsfält.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Dra-och-släpp-sortering för tabellrader


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Förklaring av sorteringsregler

Anta att den nuvarande ordningen är:

```
[1,2,3,4,5,6,7,8,9]
```

När ett element (t.ex. 5) flyttas framåt till positionen för 3, kommer endast sorteringsvärdena för 3, 4 och 5 att ändras: 5 tar positionen för 3, och 3 och 4 flyttas vardera bakåt en position.

```
[1,2,5,3,4,6,7,8,9]
```

Om ni därefter flyttar 6 bakåt till positionen för 8, tar 6 positionen för 8, och 7 och 8 flyttas vardera framåt en position.

```
[1,2,5,3,4,7,8,6,9]
```