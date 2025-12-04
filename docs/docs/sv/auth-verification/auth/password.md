---
pkg: '@nocobase/plugin-auth'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Lösenordsautentisering

## Konfigurationsgränssnitt

![](https://static-docs.nocobase.com/202411131505095.png)

## Tillåt registrering

När registrering är tillåten visas en länk för att skapa ett konto på inloggningssidan, och ni kan navigera till registreringssidan.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Registreringssida

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

När registrering inte är tillåten visas ingen länk för att skapa ett konto på inloggningssidan.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

När registrering inte är tillåten går det inte att komma åt registreringssidan.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Inställningar för registreringsformulär<Badge>v1.4.0-beta.7+</Badge>

Ni kan ställa in vilka fält i användarsamlingen som ska visas i registreringsformuläret och om de ska vara obligatoriska. Minst ett av fälten för användarnamn eller e-post måste vara inställt som synligt och obligatoriskt.

![](https://static-docs.nocobase.com/202411262133669.png)

Registreringssida

![](https://static-docs.nocobase.com/202411262135801.png)

## Glömt lösenord<Badge>v1.8.0+</Badge>

Funktionen för glömt lösenord gör det möjligt för användare att återställa sitt lösenord via e-postverifiering om de har glömt det.

### Administratörskonfiguration

1.  **Aktivera funktionen för glömt lösenord**

    I fliken "Inställningar" > "Autentisering" > "Glömt lösenord" markerar ni kryssrutan "Aktivera funktionen för glömt lösenord".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Konfigurera meddelandekanal**

    Välj en e-postmeddelandekanal (för närvarande stöds endast e-post). Om ingen meddelandekanal är tillgänglig måste ni först lägga till en.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Konfigurera e-post för återställning av lösenord**

    Anpassa e-postens ämne och innehåll, med stöd för HTML- eller oformaterad text. Ni kan använda följande variabler:
    - Nuvarande användare
    - Systeminställningar
    - Länk för återställning av lösenord
    - Återställningslänkens giltighetstid (minuter)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Ställ in återställningslänkens giltighetstid**

    Ställ in giltighetstiden (i minuter) för återställningslänken. Standard är 120 minuter.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Användarflöde

1.  **Initiera begäran om lösenordsåterställning**

    På inloggningssidan klickar ni på länken "Glömt lösenord" (administratören måste först ha aktiverat funktionen för glömt lösenord) för att komma till sidan för glömt lösenord.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Ange den registrerade e-postadressen och klicka på knappen "Skicka återställningsmejl".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Återställ lösenord**

    Användaren får ett e-postmeddelande med en återställningslänk. Klicka på länken för att öppna en sida där ni kan ställa in ett nytt lösenord.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    När detta är klart kan användaren logga in i systemet med det nya lösenordet.

### Att tänka på

- Återställningslänken har en tidsbegränsning och är som standard giltig i 120 minuter efter att den genererats (kan konfigureras av administratören).
- Länken kan endast användas en gång och blir ogiltig omedelbart efter användning.
- Om användaren inte får återställningsmejlet, kontrollera att e-postadressen är korrekt eller titta i skräppostmappen.
- Administratören bör säkerställa att e-postservern är korrekt konfigurerad för att garantera att återställningsmejlet kan skickas framgångsrikt.