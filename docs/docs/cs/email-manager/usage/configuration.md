---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Konfigurace bloků

## Blok e-mailových zpráv

### Přidání bloku

Na stránce konfigurace klikněte na tlačítko **Vytvořit blok** a vyberte blok **E-mailové zprávy (všechny)** nebo **E-mailové zprávy (osobní)**, abyste přidali blok e-mailových zpráv.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Konfigurace polí

Klikněte na tlačítko **Pole** u bloku a vyberte pole, která chcete zobrazit. Podrobné informace naleznete v metodě konfigurace polí pro tabulky.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Konfigurace filtrování dat

Klikněte na ikonu konfigurace vpravo od tabulky a vyberte **Rozsah dat**, abyste nastavili rozsah dat pro filtrování e-mailů.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

E-maily se stejnou příponou můžete filtrovat pomocí proměnných:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Blok detailů e-mailu

Nejprve na poli v bloku e-mailových zpráv povolte funkci **Povolit otevření kliknutím**:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

V kontextovém okně přidejte blok **Detaily e-mailu**:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Můžete si prohlédnout podrobný obsah e-mailu:
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Ve spodní části si můžete sami nakonfigurovat požadovaná tlačítka.

## Blok pro odesílání e-mailů

Existují dva způsoby, jak vytvořit formulář pro odesílání e-mailů:

1. Přidejte tlačítko **Odeslat e-mail** v horní části tabulky:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Přidejte blok **Odeslat e-mail**:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Oběma způsoby můžete vytvořit kompletní formulář pro odesílání e-mailů:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Každé pole v e-mailovém formuláři je shodné s běžným formulářem a lze jej nakonfigurovat s **Výchozí hodnotou** nebo **Pravidly propojení** apod.

> Formuláře pro odpověď a přeposlání e-mailu, které jsou součástí detailů e-mailu ve spodní části, standardně obsahují určité zpracování dat, které lze upravit pomocí **FlowEngine**.