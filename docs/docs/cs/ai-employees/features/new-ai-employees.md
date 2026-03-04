:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/features/new-ai-employees).
:::

# Nový AI zaměstnanec

Pokud vestavění AI zaměstnanci nevyhovují vašim potřebám, můžete si vytvořit a přizpůsobit vlastního AI zaměstnance.

## Zahájení vytváření

Přejděte na stránku správy `AI employees` a klikněte na `New AI employee`.

## Konfigurace základních informací

Na kartě `Profile` nakonfigurujte následující:

- `Username`: unikátní identifikátor.
- `Nickname`: zobrazované jméno.
- `Position`: popis pracovní pozice.
- `Avatar`: avatar zaměstnance.
- `Bio`: stručný úvod.
- `About me`: systémový prompt.
- `Greeting message`: uvítací zpráva chatu.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Nastavení role (Role setting)

Na kartě `Role setting` nakonfigurujte systémový prompt (System Prompt) zaměstnance. Tento obsah definuje identitu, cíle, pracovní hranice a styl výstupu zaměstnance během konverzací.

Doporučuje se zahrnout alespoň:

- Vymezení role a rozsah odpovědností.
- Principy zpracování úkolů a struktura odpovědí.
- Zakázané činnosti, informační hranice a požadavky na tón/styl.

Podle potřeby můžete vložit proměnné (např. aktuální uživatel, aktuální role, aktuální jazyk, datum a čas), aby se prompt automaticky přizpůsobil kontextu v různých konverzacích.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Konfigurace dovedností a znalostí

Na kartě `Skills` nakonfigurujte oprávnění k dovednostem. Pokud je povolena funkce znalostní báze, můžete pokračovat v konfiguraci na příslušných kartách souvisejících se znalostní bází.

## Dokončení vytvoření

Kliknutím na `Submit` dokončete vytváření.