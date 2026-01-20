:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Onderhoudsprocedures

## Eerste keer opstarten van de applicatie

Wanneer u de applicatie voor het eerst start, begint u met één knooppunt. Wacht tot de plugins zijn geïnstalleerd en geactiveerd, en start daarna de andere knooppunten.

## Versie-upgrade

Wanneer u een NocoBase-versie-upgrade uitvoert, volgt u deze procedure.

:::warning{title=Let op}
In een **productieomgeving** met een cluster moeten functies zoals pluginbeheer en versie-upgrades met de nodige voorzichtigheid worden gebruikt of zelfs verboden zijn.

NocoBase ondersteunt momenteel geen online upgrades voor clusterversies. Om de consistentie van gegevens te waarborgen, moeten externe services tijdens het upgrade-proces worden onderbroken.
:::

Stappen:

1.  Stop de huidige service

    Stop alle NocoBase-applicatie-instanties en leid het verkeer van de load balancer om naar een 503-statuspagina.

2.  Maak een back-up van de gegevens

    Voordat u een upgrade uitvoert, wordt sterk aanbevolen om een back-up van de database te maken om problemen tijdens het upgrade-proces te voorkomen.

3.  Update de versie

    Raadpleeg [Docker-upgrade](../get-started/upgrading/docker) om de versie van de NocoBase-applicatie-image bij te werken.

4.  Start de service

    1.  Start één knooppunt in het cluster en wacht tot de update is voltooid en het knooppunt succesvol is opgestart.
    2.  Controleer of de functionaliteit correct is. Als er problemen zijn die niet kunnen worden opgelost met probleemoplossing, kunt u teruggaan naar de vorige versie.
    3.  Start de andere knooppunten.
    4.  Leid het verkeer van de load balancer om naar het applicatiecluster.

## In-app onderhoud

In-app onderhoud verwijst naar het uitvoeren van onderhoudsgerelateerde handelingen terwijl de applicatie actief is, waaronder:

*   Pluginbeheer (plugins installeren, activeren, deactiveren, enz.)
*   Back-up en herstel
*   Beheer van omgevingsmigratie

Stappen:

1.  Knooppunten afschalen

    Schaal het aantal actieve applicatieknooppunten in het cluster terug tot één, en stop de service op de andere knooppunten.

2.  Voer in-app onderhoudshandelingen uit, zoals het installeren en activeren van plugins, het maken van back-ups van gegevens, enz.

3.  Herstel knooppunten

    Nadat de onderhoudshandelingen zijn voltooid en de functionaliteit is geverifieerd, start u de andere knooppunten. Zodra de knooppunten succesvol zijn opgestart, herstelt u de operationele status van het cluster.