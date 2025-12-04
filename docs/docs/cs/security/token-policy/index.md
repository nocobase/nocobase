---
pkg: '@nocobase/plugin-auth'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Bezpečnostní politika tokenů

## Úvod

Bezpečnostní politika tokenů je funkční konfigurace navržená k ochraně bezpečnosti systému a zlepšení uživatelského zážitku. Zahrnuje tři hlavní konfigurační položky: „Doba platnosti relace“, „Doba platnosti tokenu“ a „Časový limit pro obnovení vypršelého tokenu“.

## Kde najdete konfiguraci

Vstup do konfigurace naleznete v Nastavení pluginu - Zabezpečení - Politika tokenů:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Doba platnosti relace

**Definice:**

Doba platnosti relace označuje maximální dobu, po kterou systém uživateli umožňuje udržet aktivní relaci po přihlášení.

**Účel:**

Po překročení doby platnosti relace uživatel při dalším přístupu k systému obdrží chybovou odpověď 401 a následně bude přesměrován na přihlašovací stránku k opětovnému ověření identity.
Příklad:
Pokud je doba platnosti relace nastavena na 8 hodin, relace vyprší 8 hodin po přihlášení uživatele, za předpokladu, že nedojde k žádným dalším interakcím.

**Doporučená nastavení:**

- Scénáře krátkodobých operací: Doporučuje se 1-2 hodiny pro zvýšení bezpečnosti.
- Scénáře dlouhodobé práce: Lze nastavit na 8 hodin pro splnění obchodních potřeb.

## Doba platnosti tokenu

**Definice:**

Doba platnosti tokenu označuje životní cyklus každého tokenu vydaného systémem během aktivní relace uživatele.

**Účel:**

Když token vyprší, systém automaticky vydá nový token pro udržení aktivity relace.
Každý vypršelý token lze obnovit pouze jednou.

**Doporučená nastavení:**

Z bezpečnostních důvodů se doporučuje nastavit jej mezi 15 až 30 minutami.
Nastavení lze upravit podle požadavků scénáře. Například:
- Scénáře s vysokou bezpečností: Doba platnosti tokenu může být zkrácena na 10 minut nebo méně.
- Scénáře s nízkým rizikem: Doba platnosti tokenu může být vhodně prodloužena na 1 hodinu.

## Časový limit pro obnovení vypršelého tokenu

**Definice:**

Časový limit pro obnovení vypršelého tokenu označuje maximální časové okno, povolené pro uživatele k získání nového tokenu prostřednictvím operace obnovení poté, co token vypršel.

**Vlastnosti:**

- Pokud je překročen časový limit pro obnovení, uživatel se musí znovu přihlásit, aby získal nový token.
- Operace obnovení neprodlužuje dobu platnosti relace, pouze regeneruje token.

**Doporučená nastavení:**

Z bezpečnostních důvodů se doporučuje nastavit jej mezi 5 až 10 minutami.