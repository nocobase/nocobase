:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Thema-editor

> De huidige themafunctionaliteit is gebaseerd op Ant Design 5.x. We raden u aan om eerst de concepten van [thema's aanpassen](https://ant.design/docs/react/customize-theme) te lezen voordat u verdergaat met dit document.

## Introductie

De thema-editor plugin gebruikt u om de stijlen van de gehele frontend-pagina aan te passen. Momenteel ondersteunt het bewerken van globale [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken) en [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken). Ook kunt u [schakelen](https://ant.design/docs/react/customize-theme#use-preset-algorithms) tussen `Donkere modus` en `Compacte modus`. In de toekomst wordt mogelijk ook thematisering op [componentniveau](https://ant.design/docs/react/customize-theme#component-level-customization) ondersteund.

## Gebruiksaanwijzing

### De thema-editor plugin inschakelen

Werk NocoBase eerst bij naar de nieuwste versie (v0.11.1 of hoger). Zoek vervolgens op de pagina voor pluginbeheer naar de `Thema-editor` kaart. Klik op de knop `Inschakelen` rechtsonder op de kaart en wacht tot de pagina is vernieuwd.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Naar de themaconfiguratiepagina gaan

Nadat u de plugin heeft ingeschakeld, klikt u op de instellingenknop linksonder op de kaart om naar de thema-bewerkingspagina te gaan. Standaard zijn er vier thema-opties beschikbaar: `Standaard thema`, `Donker thema`, `Compact thema` en `Compact donker thema`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Een nieuw thema toevoegen

Klik op de knop `Nieuw thema toevoegen` en selecteer `Maak een gloednieuw thema`. Rechts op de pagina verschijnt dan een thema-editor, waarin u opties zoals `Kleuren`, `Afmetingen` en `Stijlen` kunt bewerken. Nadat u klaar bent met bewerken, voert u een themanaam in en klikt u op opslaan om het nieuwe thema aan te maken.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Een nieuw thema toepassen

Beweeg de muis naar de rechterbovenhoek van de pagina om de themaswitcher te zien. Klik erop om naar andere thema's te schakelen, zoals het zojuist toegevoegde thema.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Een bestaand thema bewerken

Klik op de knop `Bewerken` linksonder op de kaart. Rechts op de pagina verschijnt dan een thema-editor (vergelijkbaar met het toevoegen van een nieuw thema). Nadat u klaar bent met bewerken, klikt u op opslaan om de themamodificatie te voltooien.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Gebruikers selecteerbare thema's instellen

Nieuw toegevoegde thema's kunnen standaard door gebruikers worden geselecteerd. Als u niet wilt dat gebruikers naar een bepaald thema kunnen overschakelen, schakelt u de optie `Door gebruiker te selecteren` rechtsonder op de themakaart uit. Gebruikers kunnen dan niet naar dat thema overschakelen.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Instellen als standaard thema

In de beginstatus is het standaard thema `Standaard thema`. Als u een specifiek thema als standaard wilt instellen, schakelt u de `Standaard thema` schakelaar rechtsonder op de themakaart in. Dit zorgt ervoor dat gebruikers dit thema zien wanneer ze de pagina voor het eerst openen. Let op: het standaard thema kan niet worden verwijderd.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Een thema verwijderen

Klik op de knop `Verwijderen` onder de kaart en bevestig in het pop-upvenster om het thema te verwijderen.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)