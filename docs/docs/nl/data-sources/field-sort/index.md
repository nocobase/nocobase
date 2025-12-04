---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Sorteerveld

## Introductie

Sorteervelden worden gebruikt om records in een `collectie` te sorteren, met ondersteuning voor sorteren binnen groepen.

:::warning
Aangezien het sorteerveld onderdeel is van dezelfde `collectie`, kan een record niet aan meerdere groepen worden toegewezen bij het gebruik van groepssortering.
:::

## Installatie

Ingebouwde `plugin`, geen aparte installatie nodig.

## Gebruikershandleiding

### Een sorteerveld aanmaken

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Bij het aanmaken van sorteervelden worden de sorteerwaarden geïnitialiseerd:

- Als er geen groepssortering is geselecteerd, vindt de initialisatie plaats op basis van het primaire sleutelveld en het aanmaakdatumveld.
- Als er wel groepssortering is geselecteerd, worden de gegevens eerst gegroepeerd, waarna de initialisatie plaatsvindt op basis van het primaire sleutelveld en het aanmaakdatumveld.

:::warning{title="Uitleg over transactieconsistentie"}
- Als de initialisatie van de sorteerwaarde mislukt bij het aanmaken van een veld, wordt het sorteerveld niet aangemaakt.
- Binnen een bepaald bereik, als een record van positie A naar positie B wordt verplaatst, zullen de sorteerwaarden van alle records tussen A en B veranderen. Als een deel van deze update mislukt, wordt de hele verplaatsingsoperatie teruggedraaid en zullen de sorteerwaarden van de gerelateerde records niet veranderen.
:::

#### Voorbeeld 1: Het sorteerveld sort1 aanmaken

Het sorteerveld sort1 is niet gegroepeerd.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

De sorteervelden van elk record worden geïnitialiseerd op basis van het primaire sleutelveld en het aanmaakdatumveld:

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Voorbeeld 2: Een sorteerveld sort2 aanmaken op basis van groepering per Class ID

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Op dit moment worden alle records in de `collectie` eerst gegroepeerd (per Class ID), waarna het sorteerveld (sort2) wordt geïnitialiseerd. De initiële waarden van elk record zijn:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Slepen-en-neerzetten sortering

Sorteervelden worden voornamelijk gebruikt voor het slepen-en-neerzetten van records in verschillende blokken. Momenteel ondersteunen tabel- en kanban-blokken deze functionaliteit.

:::warning
- Wanneer hetzelfde sorteerveld wordt gebruikt voor slepen-en-neerzetten sortering, kan het gebruik ervan in meerdere blokken tegelijkertijd de bestaande volgorde verstoren.
- Het veld voor slepen-en-neerzetten sortering in een tabel kan geen sorteerveld met een groeperingsregel zijn.
  - Uitzondering: In een één-op-veel relatietabelblok kan de vreemde sleutel als groep dienen.
- Momenteel ondersteunt alleen het kanban-blok slepen-en-neerzetten sortering binnen groepen.
:::

#### Slepen-en-neerzetten sortering van tabelrijen

Tabelblok

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Relatietabelblok

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
In een één-op-veel relatieblok:

- Als een niet-gegroepeerd sorteerveld is geselecteerd, kunnen alle records deelnemen aan de sortering.
- Als records eerst worden gegroepeerd op de vreemde sleutel en vervolgens worden gesorteerd, heeft de sorteerregel alleen invloed op de gegevens binnen de huidige groep.

Het uiteindelijke effect is consistent, maar het aantal records dat deelneemt aan de sortering is verschillend. Voor meer details, zie [Uitleg sorteerregels](#uitleg-sorteerregels).
:::

#### Slepen-en-neerzetten sortering van kanban-kaarten

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Uitleg sorteerregels

#### Verplaatsing tussen niet-gegroepeerde (of dezelfde groep) elementen

Stel u hebt een reeks gegevens:

```
[1,2,3,4,5,6,7,8,9]
```

Wanneer een element, bijvoorbeeld 5, naar voren wordt verplaatst naar de positie van 3, veranderen alleen de posities van items 3, 4 en 5. Item 5 neemt de positie van 3 in, en items 3 en 4 schuiven elk één positie naar achteren.

```
[1,2,5,3,4,6,7,8,9]
```

Als we vervolgens item 6 naar achteren verplaatsen naar de positie van 8, neemt item 6 de positie van 8 in, en items 7 en 8 schuiven elk één positie naar voren.

```
[1,2,5,3,4,7,8,6,9]
```

#### Verplaatsing van elementen tussen verschillende groepen

Bij sortering per groep, als een record naar een andere groep wordt verplaatst, verandert de groep waartoe het behoort ook. Bijvoorbeeld:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Wanneer item 1 na item 6 wordt verplaatst (standaard erachter), verandert de groep waartoe het behoort ook van A naar B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Sorteerwijzigingen zijn onafhankelijk van de weergegeven gegevens op de interface

Denk bijvoorbeeld aan een reeks gegevens:

```
[1,2,3,4,5,6,7,8,9]
```

De interface toont alleen een gefilterde weergave:

```
[1,5,9]
```

Wanneer item 1 naar de positie van item 9 wordt verplaatst, zullen de posities van alle tussenliggende items (2, 3, 4, 5, 6, 7, 8) ook veranderen, zelfs als ze niet zichtbaar zijn.

```
[2,3,4,5,6,7,8,9,1]
```

De interface toont nu de nieuwe volgorde op basis van de gefilterde items:

```
[5,9,1]
```