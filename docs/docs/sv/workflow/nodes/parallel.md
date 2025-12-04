---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Parallell gren

Noden för parallell gren kan dela upp ett arbetsflöde i flera grenar. Varje gren kan konfigureras med olika noder, och hur grenarna exekveras beror på deras läge. Använd noden för parallell gren i scenarier där flera åtgärder behöver utföras samtidigt.

## Installation

Inbyggd plugin, ingen installation krävs.

## Skapa nod

I gränssnittet för arbetsflödeskonfiguration klickar ni på plusknappen ("+") i flödet för att lägga till en nod för "Parallell gren":

![Lägg till parallell gren](https://static-docs.nocobase.com/9e0f3faa0b9335270647a3047759eac.png)

När ni har lagt till en nod för parallell gren i arbetsflödet läggs två undergrenar till som standard. Ni kan också lägga till fler grenar genom att klicka på knappen för att lägga till gren. Valfritt antal noder kan läggas till i varje gren. Onödiga grenar kan tas bort genom att klicka på borttagningsknappen i början av grenen.

![Hantera parallella grenar](https://static-docs.nocobase.com/36089b8b79711eb3ee9bc2a757.png)

## Nodkonfiguration

### Grenläge

Noden för parallell gren har följande tre lägen:

- **Alla lyckas**: Arbetsflödet fortsätter bara att exekvera noderna efter grenarna om alla grenar exekveras framgångsrikt. Annars, om någon gren avslutas i förtid, oavsett om det beror på fel, misslyckande eller något annat icke-framgångsrikt tillstånd, kommer hela noden för parallell gren att avslutas i förtid med den statusen. Detta kallas även för "Alla-läge".
- **Någon lyckas**: Arbetsflödet fortsätter att exekvera noderna efter grenarna så snart någon gren exekveras framgångsrikt. Hela noden för parallell gren avslutas bara i förtid om alla grenar avslutas i förtid, oavsett om det beror på fel, misslyckande eller något annat icke-framgångsrikt tillstånd. Detta kallas även för "Någon-läge".
- **Någon lyckas eller misslyckas**: Arbetsflödet fortsätter att exekvera noderna efter grenarna så snart någon gren exekveras framgångsrikt. Men om någon nod misslyckas, kommer hela den parallella grenen att avslutas i förtid med den statusen. Detta kallas även för "Race-läge".

Oavsett läge kommer varje gren att försöka exekveras i ordning från vänster till höger tills villkoren för det förinställda grenläget är uppfyllda, varpå det antingen fortsätter till efterföljande noder eller avslutas i förtid.

## Exempel

Se exemplet i [Fördröjningsnod](./delay.md).