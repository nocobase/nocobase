:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Ställa in valideringsregler

## Introduktion

Valideringsregler används för att säkerställa att användarens inmatade data uppfyller förväntningarna.

## Var ställer ni in fältvalideringsregler?

### Konfigurera valideringsregler för samlingsfält

De flesta fält stöder konfiguration av valideringsregler. När ett fält har konfigurerats med valideringsregler utlöses backend-validering när data skickas in. Olika typer av fält stöder olika valideringsregler.

- **Datumfält**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Numeriskt fält**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Textfält**

  Förutom att begränsa textlängden stöder textfält även anpassade reguljära uttryck för mer detaljerad validering.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Frontend-validering i fältkonfigurationen

Valideringsregler som ställs in i fältkonfigurationen kommer att utlösa frontend-validering för att säkerställa att användarens inmatning följer reglerna.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Textfält** stöder även anpassad regex-validering för att uppfylla specifika formatkrav.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)