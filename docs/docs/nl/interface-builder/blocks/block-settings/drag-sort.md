:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/blocks/block-settings/drag-sort) voor nauwkeurige informatie.
:::

# Slepen en neerzetten sorteren

## Introductie

Slepen en neerzetten sorteren is afhankelijk van een sorteerveld om records binnen een blok handmatig te herordenen.


:::info{title=Tip}
* Wanneer hetzelfde sorteerveld wordt gebruikt voor slepen en neerzetten in meerdere blokken, kan dit de bestaande volgorde verstoren.
* Bij het sorteren via slepen en neerzetten in een tabel, kunnen er geen groeperingsregels voor het sorteerveld worden ingesteld.
* Boomstructuurtabellen ondersteunen alleen het sorteren van knooppunten binnen hetzelfde niveau.

:::


## Configuratie

Voeg een veld van het type "Sorteren" toe. Sorteervelden worden niet langer automatisch gegenereerd bij het maken van een collectie; deze moeten handmatig worden aangemaakt.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Bij het inschakelen van slepen en neerzetten voor een tabel, moet u een sorteerveld selecteren.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Slepen en neerzetten voor tabelrijen


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Uitleg van de sorteerregels

Stel dat de huidige volgorde als volgt is:

```
[1,2,3,4,5,6,7,8,9]
```

Wanneer een element (bijvoorbeeld 5) naar voren wordt verplaatst naar de positie van 3, veranderen alleen de sorteerwaarden van 3, 4 en 5: 5 neemt de positie van 3 in, en 3 en 4 schuiven elk één positie naar achteren.

```
[1,2,5,3,4,6,7,8,9]
```

Als u vervolgens 6 naar achteren verplaatst naar de positie van 8, neemt 6 de positie van 8 in, en schuiven 7 en 8 elk één positie naar voren.

```
[1,2,5,3,4,7,8,6,9]
```