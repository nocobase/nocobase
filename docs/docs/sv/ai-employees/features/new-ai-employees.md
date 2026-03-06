:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/features/new-ai-employees).
:::

# Skapa ny AI-medarbetare

Om de inbyggda AI-medarbetarna inte uppfyller era behov, kan ni skapa och anpassa er egen AI-medarbetare.

## Kom igång

Gå till hanteringssidan för `AI employees` och klicka på `New AI employee`.

## Grundläggande profilkonfiguration

Konfigurera följande under fliken `Profile`:

- `Username`: Unik identifierare.
- `Nickname`: Visningsnamn.
- `Position`: Rollbeskrivning.
- `Avatar`: Medarbetarens profilbild.
- `Bio`: Kort introduktion.
- `About me`: Systemprompt.
- `Greeting message`: Välkomstmeddelande för chatt.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Rollinställningar (Role setting)

Under fliken `Role setting` konfigurerar ni medarbetarens systemprompt (System Prompt). Detta innehåll definierar medarbetarens identitet, mål, arbetsgränser och utformning av svar under konversationer.

Vi rekommenderar att ni inkluderar minst:

- Rollpositionering och ansvarsområde.
- Principer för uppgiftshantering och svarsstruktur.
- Förbjudna åtgärder, informationsgränser samt tonläge och stil.

Ni kan infoga variabler vid behov (till exempel aktuell användare, aktuell roll, aktuellt språk och tid), så att prompten automatiskt anpassas till sammanhanget i olika konversationer.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Konfiguration av färdigheter och kunskap

Konfigurera behörigheter för färdigheter under fliken `Skills`. Om funktionen för kunskapsbas är aktiverad kan ni fortsätta konfigurationen under de relaterade flikarna för kunskapsbaser.

## Slutför skapandet

Klicka på `Submit` för att slutföra skapandet.