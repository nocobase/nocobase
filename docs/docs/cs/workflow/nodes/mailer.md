---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Odeslání e-mailu

## Úvod

Tento plugin slouží k odesílání e-mailů. Podporuje obsah v textovém i HTML formátu.

## Vytvoření uzlu

V rozhraní pro konfiguraci pracovního postupu klikněte na tlačítko plus („+“) v rámci toku, abyste přidali uzel „Odeslání e-mailu“:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Konfigurace uzlu

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Každá možnost může využívat proměnné z kontextu pracovního postupu. Pro citlivé informace lze také použít globální proměnné a tajné klíče.

## Často kladené otázky

### Omezení frekvence odesílání e-mailů u Gmailu

Při odesílání některých e-mailů se můžete setkat s následující chybou:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Důvodem je, že Gmail omezuje frekvenci požadavků na odesílání z nespecifikovaných domén. Při nasazování aplikace je nutné nakonfigurovat název hostitele serveru na doménu, kterou máte nakonfigurovanou v Gmailu. Například při nasazení v Dockeru:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Nastavte na vaši nakonfigurovanou odesílací doménu
```

Reference: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)