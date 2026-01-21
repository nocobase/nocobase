:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pravidla propojení akcí

## Úvod

Pravidla propojení akcí umožňují uživatelům dynamicky řídit stav akce (například zobrazit, povolit, skrýt, zakázat atd.) na základě specifických podmínek. Konfigurací těchto pravidel můžete propojit chování akčních tlačítek s aktuálním záznamem, uživatelskou rolí nebo kontextovými daty.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Jak používat

Pokud je splněna podmínka (pokud není podmínka nastavena, je ve výchozím nastavení splněna), spustí se nastavení vlastností nebo vykonání JavaScriptu. V podmínkovém vyhodnocení jsou podporovány konstanty a proměnné.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Pravidlo podporuje úpravu vlastností tlačítek.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Konstanty

Příklad: Zaplacené objednávky nelze upravovat.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Proměnné

### Systémové proměnné

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Příklad 1: Ovládejte viditelnost tlačítka na základě aktuálního typu zařízení.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Příklad 2: Tlačítko hromadné aktualizace v záhlaví tabulky bloku objednávek je dostupné pouze pro roli Administrátora; ostatní role tuto akci nemohou provést.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Kontextové proměnné

Příklad: Tlačítko Přidat na obchodních příležitostech objednávky (blok propojení) je povoleno pouze, když je stav objednávky „Čeká na platbu“ nebo „Koncept“. V jiných stavech bude tlačítko zakázáno.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Více informací o proměnných naleznete v [Proměnné](/interface-builder/variables).