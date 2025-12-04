:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Expressionssamling

## Skapa en mall för "expressionssamling"

Innan ni kan använda noder för dynamiska uttrycksoperationer i ett arbetsflöde, måste ni först skapa en mall för en "expressionssamling" med hjälp av verktyget för samlingshantering. Denna samling kommer att fungera som en lagringsplats för olika uttryck:

![Skapa en expressionssamling](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Ange expressionsdata

Därefter kan ni skapa ett tabellblock och mata in flera formelposter i mallsamlingen. Varje rad i mallen för "expressionssamling" kan ses som en beräkningsregel utformad för en specifik datamodell inom samlingen. Ni kan använda olika fält från datamodellerna i olika samlingar som variabler för att skapa unika uttryck som beräkningsregler. Dessutom kan ni vid behov utnyttja olika beräkningsmotorer.

![Ange expressionsdata](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tips}
När formlerna väl är etablerade behöver de kopplas till affärsdata. Att direkt associera varje rad affärsdata med formeldata kan vara omständligt. Därför är en vanlig metod att använda en metadatasamling, liknande en klassificeringssamling, för att skapa en många-till-en (eller en-till-en) relation med formelsamlingen. Därefter associeras affärsdata med den klassificerade metadatan i en många-till-en-relation. Detta tillvägagångssätt gör att ni enkelt kan specificera relevant klassificerad metadata när ni skapar affärsdata, vilket gör det enkelt att hitta och använda motsvarande formeldata via den etablerade kopplingsvägen.
:::

## Ladda relevant data i processen

Som exempel, överväg att skapa ett arbetsflöde som utlöses av en samlingshändelse. När en order skapas ska triggern förladda den associerade produktdata tillsammans med de produktrelaterade expressionsdata.

![Samlingshändelse_Triggerkonfiguration](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)