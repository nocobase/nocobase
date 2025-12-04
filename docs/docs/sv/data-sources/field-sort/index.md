---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Sorteringsfält

## Introduktion

Sorteringsfält används för att sortera poster i en samling. De stöder även sortering inom grupper.

:::warning
Eftersom sorteringsfältet tillhör samma samling, kan en post inte tilldelas flera grupper när gruppsortering används.
:::

## Installation

Detta är en inbyggd plugin och kräver ingen separat installation.

## Användarmanual

### Skapa ett sorteringsfält

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

När du skapar sorteringsfält kommer sorteringsvärdena att initieras:

- Om gruppsortering inte väljs, initieras värdena baserat på primärnyckelfältet och skapandedatumfältet.
- Om gruppsortering väljs, grupperas datan först, och därefter initieras värdena baserat på primärnyckelfältet och skapandedatumfältet.

:::warning{title="Förklaring av transaktionskonsistens"}
- Om initieringen av sorteringsvärdet misslyckas när du skapar ett fält, kommer sorteringsfältet inte att skapas.
- Om en post flyttas från position A till position B inom ett visst intervall, kommer sorteringsvärdena för alla poster mellan A och B att ändras. Om någon del av denna uppdatering misslyckas, kommer hela flyttoperationen att återställas, och sorteringsvärdena för de berörda posterna kommer inte att ändras.
:::

#### Exempel 1: Skapa fältet sort1

Fältet sort1 är inte grupperat.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Sorteringsfälten för varje post kommer att initieras baserat på primärnyckelfältet och skapandedatumfältet.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Exempel 2: Skapa ett sort2-fält baserat på gruppering med Klass-ID

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Då kommer alla poster i samlingen först att grupperas (efter Klass-ID), och därefter initieras sorteringsfältet (sort2). De initiala värdena för varje post är:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Dra-och-släpp-sortering

Sorteringsfält används främst för dra-och-släpp-sortering av poster i olika block. De block som för närvarande stöder dra-och-släpp-sortering inkluderar tabeller och tavlor.

:::warning
- Om samma sorteringsfält används för dra-och-släpp-sortering i flera block samtidigt, kan det störa den befintliga ordningen.
- Fältet för dra-och-släpp-sortering i tabeller kan inte vara ett sorteringsfält med en grupperingsregel.
  - Undantag: I ett tabellblock med en-till-många-relation kan främmande nyckeln fungera som en grupp.
- För närvarande stöder endast tavlor dra-och-släpp-sortering inom grupper.
:::

#### Dra-och-släpp-sortering av tabellrader

Tabellblock

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Relationstabellblock

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
I ett en-till-många-relationsblock:

- Om ett ogrupperat sorteringsfält väljs, kan alla poster delta i sorteringen.
- Om poster först grupperas efter främmande nyckel och sedan sorteras, kommer sorteringsregeln endast att påverka datan inom den aktuella gruppen.

Slutresultatet är konsekvent, men antalet poster som deltar i sorteringen skiljer sig åt. För mer information, se [Förklaring av sorteringsregler](#förklaring-av-sorteringsregler).
:::

#### Dra-och-släpp-sortering av tavlekort

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Förklaring av sorteringsregler

#### Förflyttning mellan ogrupperade (eller samma grupp) element

Anta att det finns en uppsättning data:

```
[1,2,3,4,5,6,7,8,9]
```

När ett element, säg 5, flyttas framåt till position 3, ändras endast positionerna för elementen 3, 4 och 5. Element 5 tar position 3, och element 3 och 4 flyttas vardera ett steg bakåt.

```
[1,2,5,3,4,6,7,8,9]
```

Om vi sedan flyttar element 6 bakåt till position 8, tar element 6 position 8, och element 7 och 8 flyttas vardera ett steg framåt.

```
[1,2,5,3,4,7,8,6,9]
```

#### Förflyttning av element mellan olika grupper

Vid gruppsortering, om en post flyttas till en annan grupp, kommer dess grupptillhörighet också att ändras. Till exempel:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

När element 1 flyttas efter element 6 (standardbeteendet), kommer dess grupp också att ändras från A till B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Sorteringsändringar är oberoende av data som visas i gränssnittet

Anta till exempel en uppsättning data:

```
[1,2,3,4,5,6,7,8,9]
```

Gränssnittet visar endast en filtrerad vy:

```
[1,5,9]
```

När element 1 flyttas till position 9, kommer positionerna för alla mellanliggande element (2, 3, 4, 5, 6, 7, 8) också att ändras, även om de inte är synliga.

```
[2,3,4,5,6,7,8,9,1]
```

Gränssnittet visar nu den nya ordningen baserat på de filtrerade elementen:

```
[5,9,1]
```