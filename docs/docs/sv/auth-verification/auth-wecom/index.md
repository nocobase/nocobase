---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Autentisering: WeCom

## Introduktion

**WeCom**-pluginet låter användare logga in på NocoBase med sina WeCom-konton.

## Aktivera plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Skapa och konfigurera en anpassad WeCom-applikation

Gå till WeCom-administratörskonsolen för att skapa en anpassad applikation.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Klicka på applikationen för att komma till dess detaljsida, scrolla ner och klicka på "WeCom auktoriserad inloggning".

![](https://static-docs.nocobase.com/202406272104655.png)

Ställ in den auktoriserade callback-domänen till din NocoBase-applikationsdomän.

![](https://static-docs.nocobase.com/202406272105662.png)

Återgå till appens detaljsida och klicka på "Webbauktorisering och JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Ställ in och verifiera callback-domänen för appens OAuth2.0 webbauktoriseringsfunktion.

![](https://static-docs.nocobase.com/202406272107899.png)

På appens detaljsida klickar du på "Företagets betrodda IP".

![](https://static-docs.nocobase.com/202406272108834.png)

Konfigurera NocoBase-applikationens IP.

![](https://static-docs.nocobase.com/202406272109805.png)

## Hämta autentiseringsuppgifter från WeCom-administratörskonsolen

I WeCom-administratörskonsolen, under "Mitt företag", kopierar du "Företags-ID".

![](https://static-docs.nocobase.com/202406272111637.png)

I WeCom-administratörskonsolen, under "Apphantering", går du till detaljsidan för applikationen som skapades i föregående steg och kopierar AgentId och Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Lägg till WeCom-autentisering i NocoBase

Gå till sidan för hantering av användarautentiseringsplugin.

![](https://static-docs.nocobase.com/202406272115044.png)

Lägg till - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Konfiguration

![](https://static-docs.nocobase.com/202412041459250.png)

| Konfigurationsalternativ                                                                              | Beskrivning                                                                                                                                                                                   | Versionskrav |
| :---------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| När ett telefonnummer inte matchar en befintlig användare, <br />ska en ny användare skapas automatiskt | När ett telefonnummer inte matchar en befintlig användare, om en ny användare ska skapas automatiskt.                                                                                         | -            |
| Företags-ID                                                                                           | Företags-ID, hämtas från WeCom-administratörskonsolen.                                                                                                                                        | -            |
| AgentId                                                                                               | Hämtas från konfigurationen av den anpassade applikationen i WeCom-administratörskonsolen.                                                                                                    | -            |
| Secret                                                                                                | Hämtas från konfigurationen av den anpassade applikationen i WeCom-administratörskonsolen.                                                                                                    | -            |
| Origin                                                                                                | Den aktuella applikationsdomänen.                                                                                                                                                             | -            |
| Länk för omdirigering till arbetsbänksapplikation                                                     | Applikationssökvägen att omdirigera till efter en lyckad inloggning.                                                                                                                          | `v1.4.0`     |
| Automatisk inloggning                                                                                 | Logga in automatiskt när applikationslänken öppnas i WeCom-webbläsaren. När flera WeCom-autentiserare är konfigurerade kan endast en ha detta alternativ aktiverat.                          | `v1.4.0`     |
| Länk till arbetsbänksapplikationens startsida                                                         | Länk till arbetsbänksapplikationens startsida.                                                                                                                                                | -            |

## Konfigurera WeCom-applikationens startsida

:::info
För versioner `v1.4.0` och senare, när alternativet "Automatisk inloggning" är aktiverat, kan applikationens startsida förenklas till: `https://<url>/<path>`, till exempel `https://example.nocobase.com/admin`.

Ni kan också konfigurera separata länkar för mobil och dator, till exempel `https://example.nocobase.com/m` och `https://example.nocobase.com/admin`.
:::

Gå till WeCom-administratörskonsolen och klistra in den kopierade länken till arbetsbänksapplikationens startsida i adressfältet för startsidan för den motsvarande applikationen.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Logga in

Besök inloggningssidan och klicka på knappen under inloggningsformuläret för att initiera tredjepartsinloggning.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
På grund av WeComs behörighetsbegränsningar för känslig information som telefonnummer kan auktorisering endast slutföras inom WeCom-klienten. När ni loggar in med WeCom för första gången, följ stegen nedan för att slutföra den första inloggningsauktoriseringen inom WeCom-klienten.
:::

## Första inloggningen

Från WeCom-klienten, gå till Arbetsbänken, scrolla ner till botten och klicka på applikationen för att komma till den startsida ni tidigare konfigurerade. Detta kommer att slutföra den första auktoriseringen. Därefter kan ni använda WeCom för att logga in på er NocoBase-applikation.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />