:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Integration

## Översikt

NocoBase erbjuder omfattande integrationsmöjligheter som gör det möjligt att smidigt ansluta till externa system, tredjepartstjänster och olika datakällor. Genom flexibla integrationsmetoder kan ni utöka NocoBase funktionalitet för att möta varierande affärsbehov.

## Integrationsmetoder

### API-integration

NocoBase erbjuder kraftfulla API-funktioner för att integrera med externa applikationer och tjänster:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API-nycklar](/integration/api-keys/)**: Använd API-nycklar för säker autentisering och programmatisk åtkomst till NocoBase-resurser.
- **[API-dokumentation](/integration/api-doc/)**: Inbyggd API-dokumentation för att utforska och testa slutpunkter.

### Enkel inloggning (SSO)

Integrera med företagets identitetssystem för en enhetlig autentisering:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[SSO-integration](/integration/sso/)**: Stöd för SAML, OIDC, CAS, LDAP och autentisering via tredjepartsplattformar.
- Centraliserad användarhantering och åtkomstkontroll.
- En sömlös autentiseringsupplevelse över olika system.

### Arbetsflödesintegration

Anslut NocoBase arbetsflöden till externa system:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Arbetsflödes-Webhook](/integration/workflow-webhook/)**: Ta emot händelser från externa system för att trigga arbetsflöden.
- **[Arbetsflödes HTTP-förfrågan](/integration/workflow-http-request/)**: Skicka HTTP-förfrågningar till externa API:er från arbetsflöden.
- Automatisera affärsprocesser över plattformar.

### Externa datakällor

Anslut till externa databaser och datasystem:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Externa databaser](/data-sources/)**: Anslut direkt till MySQL, PostgreSQL, MariaDB, MSSQL, Oracle och KingbaseES-databaser.
- Känn igen externa databastabellstrukturer och utför CRUD-operationer (skapa, läsa, uppdatera, radera) direkt på extern data i NocoBase.
- Ett enhetligt gränssnitt för datahantering.

### Inbäddat innehåll

Bädda in externt innehåll i NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe-block](/integration/block-iframe/)**: Bädda in externa webbsidor och applikationer.
- **JS-block**: Utför anpassad JavaScript-kod för avancerade integrationer.

## Vanliga integrationsscenarier

### Integration med företagssystem

- Anslut NocoBase till ERP, CRM eller andra företagssystem.
- Synkronisera data dubbelriktat.
- Automatisera arbetsflöden över systemgränser.

### Integration med tredjepartstjänster

- Fråga betalningsstatus från betalningsgateways, integrera med meddelandetjänster eller molnplattformar.
- Utnyttja externa API:er för att utöka funktionaliteten.
- Bygg anpassade integrationer med webhooks och HTTP-förfrågningar.

### Dataintegration

- Anslut till flera datakällor.
- Aggregera data från olika system.
- Skapa enhetliga instrumentpaneler och rapporter.

## Säkerhetsöverväganden

När ni integrerar NocoBase med externa system, överväg följande bästa praxis för säkerhet:

1.  **Använd HTTPS**: Använd alltid krypterade anslutningar för dataöverföring.
2.  **Skydda API-nycklar**: Lagra API-nycklar säkert och rotera dem regelbundet.
3.  **Principen om minsta möjliga behörighet**: Ge endast de behörigheter som är absolut nödvändiga för integrationen.
4.  **Revisionsloggning**: Övervaka och logga integrationsaktiviteter.
5.  **Datavalidering**: Validera all data från externa källor.