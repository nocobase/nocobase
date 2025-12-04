:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Använda variabler

## Kärnkoncept

Precis som variabler i ett programmeringsspråk är **variabler** i ett arbetsflöde ett viktigt verktyg för att koppla samman och organisera processer.

När varje nod exekveras efter att ett arbetsflöde har triggats, kan vissa konfigurationsalternativ använda variabler. Källan till dessa variabler är data från nodens föregående noder (upstream-noder), och inkluderar följande kategorier:

- Triggerkontextdata: I fall som åtgärdstriggers eller samlingstriggers kan ett enskilt radobjekt användas som en variabel av alla noder. Specifikationerna varierar beroende på hur varje trigger är implementerad.
- Data från föregående noder (upstream-noder): När processen når en nod är det resultatdata från tidigare slutförda noder.
- Lokala variabler: När en nod befinner sig inom speciella förgreningsstrukturer kan den använda specifika lokala variabler inom den grenen. Till exempel kan dataobjektet för varje iteration användas i en loop-struktur.
- Systemvariabler: Vissa inbyggda systemparametrar, som till exempel aktuell tid.

Vi har använt variabel-funktionen flera gånger i [Snabbstart](../getting-started.md). Till exempel kan vi i en beräkningsnod använda variabler för att referera till triggerkontextdata för att utföra beräkningar:

![Beräkningsnod som använder funktioner och variabler](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

I en uppdateringsnod använder ni triggerkontextdata som en variabel för filtervillkoret, och refererar till resultatet från beräkningsnoden som en variabel för fältvärdet som ska uppdateras:

![Variabler för uppdateringsnod](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Datastruktur

En variabel är internt en JSON-struktur, och ni kan vanligtvis använda en specifik del av datan via dess JSON-sökväg. Eftersom många variabler baseras på NocoBases samlingsstruktur, kommer relationsdata att struktureras hierarkiskt som objektegenskaper och bilda en trädliknande struktur. Till exempel kan vi välja värdet för ett specifikt fält från relationsdatan för den efterfrågade datan. Dessutom, när relationsdatan har en "till-många"-struktur, kan variabeln vara en array.

När ni väljer en variabel behöver ni oftast välja den sista nivån av värdeattributet, vilket vanligtvis är en enkel datatyp som ett nummer eller en sträng. Men när det finns en array i variabelhierarkin kommer attributet på den sista nivån också att mappas till en array. Endast om den motsvarande noden stöder arrayer kan arraydata bearbetas korrekt. Till exempel, i en beräkningsnod har vissa beräkningsmotorer funktioner specifikt för att hantera arrayer. Ett annat exempel är i en loop-nod, där loop-objektet också kan vara en array.

Till exempel, när en frågenod frågar efter flera dataposter, kommer nodresultatet att vara en array som innehåller flera rader med homogen data:

```json
[
  {
    "id": 1,
    "title": "Titel 1"
  },
  {
    "id": 2,
    "title": "Titel 2"
  }
]
```

Men när ni använder det som en variabel i efterföljande noder, om den valda variabeln är i formen `Noddata/Frågenod/Titel`, kommer ni att få en array som mappats till motsvarande fältvärden:

```json
["Titel 1", "Titel 2"]
```

Om det är en flerdimensionell array (som ett "många-till-många"-relationsfält), kommer ni att få en endimensionell array där motsvarande fält har plattats ut.

## Systeminbyggda variabler

### Systemtid

Hämtar systemtiden vid det ögonblick då noden exekveras. Tidszonen för denna tid är den som är inställd på servern.

### Datumintervallparametrar

Kan användas vid konfigurering av filtervillkor för datumfält i fråge-, uppdaterings- och borttagningsnoder. Det stöds endast för "är lika med"-jämförelser. Både start- och sluttidpunkterna för datumintervallet baseras på den tidszon som är inställd på servern.

![Datumintervallparametrar](https://static-docs.nocobase.com/20240817175354.png)