:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Konfigurationsguide

### Aktivera utskrift med mallar
Mallutskrift stöder för närvarande detaljblock och tabellblock. Nedan beskriver vi hur ni konfigurerar dessa två typer av block.

#### Detaljblock

1.  **Öppna detaljblocket**:
    -   I applikationen navigerar ni till det detaljblock där ni vill använda mallutskriftsfunktionen.

2.  **Öppna konfigurationsmenyn**:
    -   Klicka på menyn "Konfigurationsåtgärd" högst upp i gränssnittet.

3.  **Välj "Mallutskrift"**:
    -   I rullgardinsmenyn klickar ni på alternativet "Mallutskrift" för att aktivera **plugin**-funktionen.

![Aktivera mallutskrift](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Konfigurera mallar

1.  **Gå till sidan för mallkonfiguration**:
    -   I konfigurationsmenyn för knappen "Mallutskrift" väljer ni alternativet "Mallkonfiguration".

![Alternativ för mallkonfiguration](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Lägg till en ny mall**:
    -   Klicka på knappen "Lägg till mall" för att komma till sidan för malltillägg.

![Knappen Lägg till mall](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Fyll i mallinformationen**:
    -   I mallformuläret fyller ni i mallens namn och väljer malltyp (Word, Excel, PowerPoint).
    -   Ladda upp den motsvarande mallfilen (stöder formaten `.docx`, `.xlsx`, `.pptx`).

![Konfigurera mallnamn och fil](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Redigera och spara mallen**:
    -   Gå till sidan "Fältlista", kopiera fält och fyll i dem i mallen.
    ![Fältlista](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   När ni har fyllt i detaljerna klickar ni på knappen "Spara" för att slutföra tillägget av mallen.

5.  **Mallhantering**:
    -   Klicka på knappen "Använd" till höger om malllistan för att aktivera mallen.
    -   Klicka på knappen "Redigera" för att ändra mallens namn eller ersätta mallfilen.
    -   Klicka på knappen "Ladda ner" för att ladda ner den konfigurerade mallfilen.
    -   Klicka på knappen "Ta bort" för att ta bort mallar som inte längre behövs. Systemet kommer att be er bekräfta åtgärden för att undvika oavsiktlig radering.
    ![Mallhantering](https://static-docs.nocobase.com/20250107140436.png)

#### Tabellblock

Användningen av tabellblock är i princip densamma som för detaljblock, med följande skillnader:

1.  **Stöd för utskrift av flera poster**: Ni måste först markera de poster ni vill skriva ut. Ni kan skriva ut upp till 100 poster samtidigt.
    
![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Isolerad mallhantering**: Mallar för tabellblock och detaljblock är inte utbytbara – eftersom datastrukturerna skiljer sig åt (det ena är ett objekt, det andra är en array).