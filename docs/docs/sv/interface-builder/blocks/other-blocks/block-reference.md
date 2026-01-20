---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Referensblock

## Introduktion
Referensblocket visar ett befintligt block på den aktuella sidan genom att ange målblockets UID. Ni behöver inte konfigurera om målblocket.

## Aktivera plugin
Detta plugin är inbyggt men inaktiverat som standard.
Öppna "Pluginhanteraren" → hitta "Block: Referens" → klicka på "Aktivera".

![Aktivera referensblock i Pluginhanteraren](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Hur man lägger till
1) Lägg till ett block → "Andra block" → välj "Referensblock".
2) I "Referensblockets inställningar" konfigurerar Ni:
   - `Block UID`: Målblockets UID
   - `Referensläge`: Välj `Referens` eller `Kopiera`

![Demonstration av att lägga till och konfigurera referensblock](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Hur man får Block UID
- Öppna målblockets inställningsmeny och klicka på `Kopiera UID` för att kopiera dess UID.

![Kopiera UID från blockinställningar](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Lägen och beteende
- `Referens` (standard)
  - Delar samma konfiguration som originalblocket; ändringar i originalet eller från någon refererad plats kommer att uppdatera alla referenser.

- `Kopiera`
  - Skapar ett oberoende block som är identiskt med originalet vid det tillfället; senare ändringar synkroniseras inte mellan dem.

## Konfiguration
- Referensblock:
  - "Referensblockets inställningar": Ange målblockets UID och välj läget Referens/Kopiera;
  - Ni kommer också att se de fullständiga inställningarna för det refererade blocket (motsvarande att konfigurera originalblocket direkt).

![Inställningar för referensblock](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Kopierat block:
  - Det nya blocket har samma typ som originalet och endast sina egna inställningar;
  - Det inkluderar inte "Referensblockets inställningar".

## Fel och reservlägen
- Ogiltigt eller saknat mål: Visar ett felmeddelande. Konfigurera om i Referensblockets inställningar (Referensblockets inställningar → Block UID) och spara för att återställa.

![Felstatus när målblocket är ogiltigt](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Anmärkningar och begränsningar
- Experimentell funktion – använd med försiktighet i produktionsmiljöer.
- Vid kopiering kan vissa konfigurationer som är beroende av mål-UID behöva konfigureras om.
- Alla konfigurationer för ett refererat block synkroniseras automatiskt, inklusive dataomfång. Ett refererat block kan dock ha sin egen [händelseflödeskonfiguration](/interface-builder/event-flow/). Med händelseflöden och anpassade JavaScript-åtgärder kan Ni indirekt uppnå olika dataomfång eller relaterade konfigurationer per referens.