:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Underhållsprocedurer

## Första start av applikationen

När ni startar applikationen för första gången, börja med att starta en nod. Vänta tills **pluginen** har installerats och aktiverats, starta sedan de övriga noderna.

## Versionsuppgradering

När ni behöver uppgradera NocoBase-versionen, följ denna procedur.

:::warning{title=Obs!}
I en klusterbaserad **produktionsmiljö** bör funktioner som **pluginhantering** och versionsuppgraderingar användas med försiktighet eller förbjudas.

NocoBase stöder för närvarande inte onlineuppgraderingar för klusterversioner. För att säkerställa datakonsistens måste externa tjänster pausas under uppgraderingsprocessen.
:::

Steg:

1.  Stoppa den aktuella tjänsten

    Stoppa alla NocoBase-applikationsinstanser och vidarebefordra lastbalanserarens trafik till en 503-statussida.

2.  Säkerhetskopiera data

    Innan uppgraderingen rekommenderas det starkt att ni säkerhetskopierar databasen för att förhindra eventuella problem under uppgraderingsprocessen.

3.  Uppdatera versionen

    Se [Docker-uppgradering](../get-started/upgrading/docker) för att uppdatera NocoBase-applikationsavbildningens version.

4.  Starta tjänsten

    1. Starta en nod i klustret och vänta tills uppdateringen är klar och noden har startat framgångsrikt.
    2. Verifiera att funktionaliteten är korrekt. Om det uppstår problem som inte kan lösas genom felsökning, kan ni återgå till den tidigare versionen.
    3. Starta de övriga noderna.
    4. Omdirigera lastbalanserarens trafik till applikationsklustret.

## Underhåll i applikationen

Underhåll i applikationen avser att utföra underhållsrelaterade åtgärder medan applikationen körs, inklusive:

*   **Pluginhantering** (installera, aktivera, inaktivera **plugin**, etc.)
*   Säkerhetskopiering och återställning
*   Hantering av miljömigrering

Steg:

1.  Skala ner noder

    Minska antalet körande applikationsnoder i klustret till en, och stoppa tjänsten på de övriga noderna.

2.  Utför underhållsåtgärder i applikationen, såsom att installera och aktivera **plugin**, säkerhetskopiera **data**, etc.

3.  Återställ noder

    När underhållsåtgärderna är slutförda och funktionaliteten har verifierats, starta de övriga noderna. När noderna har startat framgångsrikt, återställ klustrets driftstatus.