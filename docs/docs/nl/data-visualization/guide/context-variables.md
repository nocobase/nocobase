:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Contextvariabelen gebruiken

Met contextvariabelen kunt u informatie van de huidige pagina, gebruiker, tijd en filterinvoer direct hergebruiken. Zo kunt u grafieken renderen en koppelingen inschakelen op basis van de context.

## Toepassingsgebied
- Bij gegevensquery's in de Builder-modus: selecteer variabelen voor filtercondities.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Bij gegevensquery's in de SQL-modus: kies variabelen en voeg expressies in (bijvoorbeeld `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Bij grafiekopties in de Custom-modus: schrijf direct JS-expressies.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Bij interactie-evenementen (bijvoorbeeld klikken om een drill-down dialoogvenster te openen en gegevens door te geven): schrijf direct JS-expressies.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Let op:**
- Plaats geen enkele of dubbele aanhalingstekens rond `{{ ... }}`; de binding wordt veilig afgehandeld op basis van het variabele type (string, getal, tijd, NULL).
- Wanneer een variabele `NULL` of ongedefinieerd is, behandel null-waarden dan expliciet in SQL met behulp van `COALESCE(...)` of `IS NULL`.