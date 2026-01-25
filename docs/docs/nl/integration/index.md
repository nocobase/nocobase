:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Integratie

## Overzicht

NocoBase biedt uitgebreide integratiemogelijkheden, waardoor naadloze verbindingen met externe systemen, diensten van derden en diverse gegevensbronnen mogelijk zijn. Dankzij flexibele integratiemethoden kunt u de functionaliteit van NocoBase uitbreiden om aan uiteenlopende zakelijke behoeften te voldoen.

## Integratiemethoden

### API-integratie

NocoBase biedt krachtige API-mogelijkheden voor integratie met externe applicaties en diensten:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API-sleutels](/integration/api-keys/)**: Gebruik API-sleutels voor veilige authenticatie en programmatische toegang tot NocoBase-bronnen.
- **[API-documentatie](/integration/api-doc/)**: Ingebouwde API-documentatie voor het verkennen en testen van endpoints.

### Single Sign-On (SSO)

Integreer met bedrijfsidentiteitssystemen voor uniforme authenticatie:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[SSO-integratie](/integration/sso/)**: Ondersteuning voor SAML, OIDC, CAS, LDAP en authenticatie via platforms van derden.
- Gecentraliseerd gebruikersbeheer en toegangscontrole.
- Naadloze authenticatie-ervaring over verschillende systemen heen.

### Workflow-integratie

Verbind NocoBase-workflows met externe systemen:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Workflow Webhook](/integration/workflow-webhook/)**: Ontvang gebeurtenissen van externe systemen om workflows te activeren.
- **[Workflow HTTP-verzoek](/integration/workflow-http-request/)**: Stuur HTTP-verzoeken naar externe API's vanuit workflows.
- Automatiseer bedrijfsprocessen over verschillende platforms heen.

### Externe gegevensbronnen

Maak verbinding met externe databases en datasystemen:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Externe databases](/data-sources/)**: Maak rechtstreeks verbinding met MySQL-, PostgreSQL-, MariaDB-, MSSQL-, Oracle- en KingbaseES-databases.
- Herken externe databasetabelstructuren en voer CRUD-bewerkingen (creëren, lezen, bijwerken, verwijderen) uit op externe gegevens, rechtstreeks binnen NocoBase.
- Uniforme interface voor gegevensbeheer.

### Ingesloten inhoud

Sluit externe inhoud in binnen NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe-blok](/integration/block-iframe/)**: Sluit externe webpagina's en applicaties in.
- **JS-blokken**: Voer aangepaste JavaScript-code uit voor geavanceerde integraties.

## Veelvoorkomende integratiescenario's

### Integratie met bedrijfssystemen

- Verbind NocoBase met ERP-, CRM- of andere bedrijfssystemen.
- Synchroniseer gegevens bidirectioneel.
- Automatiseer systeemoverkoepelende workflows.

### Integratie met diensten van derden

- Vraag de betaalstatus op bij betaalpoorten, integreer berichtendiensten of cloudplatforms.
- Maak gebruik van externe API's om de functionaliteit uit te breiden.
- Bouw aangepaste integraties met behulp van webhooks en HTTP-verzoeken.

### Gegevensintegratie

- Maak verbinding met meerdere gegevensbronnen.
- Aggregeer gegevens uit verschillende systemen.
- Creëer uniforme dashboards en rapporten.

## Beveiligingsoverwegingen

Wanneer u NocoBase integreert met externe systemen, houd dan rekening met de volgende best practices voor beveiliging:

1. **Gebruik HTTPS**: Gebruik altijd versleutelde verbindingen voor gegevensoverdracht.
2. **Beveilig API-sleutels**: Sla API-sleutels veilig op en roteer ze regelmatig.
3. **Principe van minimale privileges**: Verleen alleen de noodzakelijke rechten voor integraties.
4. **Auditlogging**: Bewaak en log integratieactiviteiten.
5. **Gegevensvalidatie**: Valideer alle gegevens uit externe bronnen.