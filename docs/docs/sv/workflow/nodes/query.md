:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Fråga efter data

Används för att fråga efter och hämta dataposter från en samling som uppfyller specifika villkor.

Ni kan konfigurera den för att fråga efter en enskild post eller flera poster. Frågeresultatet kan användas som en variabel i efterföljande noder. När ni frågar efter flera poster är resultatet en array. Om frågeresultatet är tomt kan ni välja om efterföljande noder ska fortsätta att köras.

## Skapa nod

I konfigurationsgränssnittet för arbetsflödet klickar ni på plusknappen ("+") i flödet för att lägga till en "Fråga efter data"-nod:

![Lägg till noden Fråga efter data](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Nodkonfiguration

![Konfiguration av frågenod](https://static-docs.nocobase.com/20240520131324.png)

### Samling

Välj den samling som ni vill fråga efter data från.

### Resultattyp

Resultattypen är uppdelad i "Enskild post" och "Flera poster":

-   Enskild post: Resultatet är ett objekt, vilket endast är den första matchande posten, eller `null`.
-   Flera poster: Resultatet blir en array som innehåller poster som matchar villkoren. Om inga poster matchar blir det en tom array. Ni kan bearbeta dem en efter en med hjälp av en Loop-nod.

### Filtreringsvillkor

Liknande filtreringsvillkoren vid en vanlig samlingsfråga, kan ni använda arbetsflödets kontextvariabler.

### Sortering

När ni frågar efter en eller flera poster kan ni använda sorteringsregler för att styra önskat resultat. Till exempel, för att fråga efter den senaste posten, kan ni sortera efter fältet "Skapandetid" i fallande ordning.

### Sidnumrering

När resultatuppsättningen kan vara mycket stor, kan ni använda sidnumrering för att kontrollera antalet frågeresultat. Till exempel, för att fråga efter de 10 senaste posterna, kan ni sortera efter fältet "Skapandetid" i fallande ordning och sedan ställa in sidnumreringen till 1 sida med 10 poster.

### Hantering av tomma resultat

I läget för enskild post, om inga data uppfyller villkoren, blir frågeresultatet `null`. I läget för flera poster blir det en tom array (`[]`). Ni kan välja om ni vill kryssa i "Avsluta arbetsflödet när frågeresultatet är tomt". Om detta är ikryssat, och frågeresultatet är tomt, kommer efterföljande noder inte att köras, och arbetsflödet avslutas i förtid med statusen misslyckad.