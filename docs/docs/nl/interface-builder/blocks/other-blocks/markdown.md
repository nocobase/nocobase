:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Markdown-blok

## Introductie

Het Markdown-blok kunt u gebruiken zonder het te koppelen aan een gegevensbron. U definieert de tekstinhoud met Markdown-syntaxis, waarna het blok deze opgemaakte tekst kan weergeven.

## Blok toevoegen

U kunt een Markdown-blok toevoegen aan een pagina of een pop-up.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

U kunt ook een inline (inline-block) Markdown-blok toevoegen binnen formulier- en detailblokken.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Sjabloon-engine

We gebruiken de **[Liquid sjabloon-engine](https://liquidjs.com/tags/overview.html)** om krachtige en flexibele sjabloonrendering te bieden. Hiermee kunt u inhoud dynamisch genereren en op maat weergeven. Met de sjabloon-engine kunt u:

- **Dynamische interpolatie**: Gebruik placeholders in de sjabloon om naar variabelen te verwijzen, bijvoorbeeld `{{ ctx.user.userName }}` wordt automatisch vervangen door de bijbehorende gebruikersnaam.
- **Conditionele rendering**: Ondersteunt conditionele statements (`{% if %}...{% else %}`), waarmee u verschillende inhoud kunt weergeven op basis van verschillende datastatussen.
- **Lussen**: Gebruik `{% for item in list %}...{% endfor %}` om door arrays of collecties te itereren en zo lijsten, tabellen of herhalende modules te genereren.
- **Ingebouwde filters**: Biedt een uitgebreide set filters (zoals `upcase`, `downcase`, `date`, `truncate`, enz.) om gegevens te formatteren en te verwerken.
- **Uitbreidbaarheid**: Ondersteunt aangepaste variabelen en functies, waardoor de sjabloonlogica herbruikbaar en onderhoudbaar wordt.
- **Beveiliging en isolatie**: Sjabloonrendering wordt uitgevoerd in een sandbox-omgeving, wat voorkomt dat gevaarlijke code direct wordt uitgevoerd en de veiligheid verhoogt.

Met de Liquid sjabloon-engine kunnen ontwikkelaars en contentmakers **eenvoudig dynamische content weergeven, gepersonaliseerde documenten genereren en sjablonen renderen voor complexe datastructuren**, wat de efficiëntie en flexibiliteit aanzienlijk verbetert.

## Variabelen gebruiken

Markdown op een pagina ondersteunt algemene systeemvariabelen (zoals de huidige gebruiker, de huidige rol, enz.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Markdown in een pop-up voor blokrij-acties (of subpagina) ondersteunt meer data-contextvariabelen (zoals de huidige record, de huidige pop-up record, enz.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## QR-code

U kunt QR-codes configureren in Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```