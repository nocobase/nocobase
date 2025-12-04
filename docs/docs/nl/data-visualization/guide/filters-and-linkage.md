:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Paginafilters en koppeling

Paginafilters (filterblokken) worden gebruikt om op paginaniveau filtercondities uniform in te voeren. Deze condities worden vervolgens samengevoegd in grafiekquery's, waardoor meerdere grafieken consistent gefilterd en gekoppeld kunnen worden.

## Functieoverzicht
- Voeg een filterblok toe aan een pagina om een centrale filtermogelijkheid te creëren voor alle grafieken op die pagina.
- Gebruik de knoppen 'Filteren', 'Resetten' en 'Inklappen' om filters toe te passen, te wissen en in te klappen.
- Als u in het filter velden selecteert die gekoppeld zijn aan een grafiek, worden de waarden automatisch samengevoegd in de grafiekquery, wat een vernieuwing van de grafiek triggert.
- Filters kunnen ook aangepaste velden aanmaken en deze registreren als contextvariabelen. Deze variabelen kunt u vervolgens gebruiken in datablokken zoals grafieken, tabellen en formulieren.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Raadpleeg de [paginafilter documentatie](#) voor meer informatie over het gebruik van paginafilters en de interactie met grafieken of andere datablokken.

## Paginafilterwaarden gebruiken in grafiekquery's
- Builder-modus (aanbevolen)
  - Automatisch samenvoegen: Als de gegevensbron en de collectie overeenkomen, hoeft u geen extra variabelen in de grafiekquery te schrijven; paginafilters worden automatisch samengevoegd met behulp van `$and`.
  - Handmatige selectie: U kunt ook handmatig waarden selecteren uit de aangepaste velden van het filterblok binnen de filtercondities van uw grafiek.

- SQL-modus (via variabele-injectie)
  - In de SQL-modus kunt u via 'Variabele kiezen' waarden invoegen uit de aangepaste velden van het filterblok.