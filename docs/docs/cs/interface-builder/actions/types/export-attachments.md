---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Export příloh

## Úvod

Export příloh umožňuje exportovat pole související s přílohami ve formátu komprimovaného balíčku.

#### Konfigurace exportu příloh

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Nakonfigurujte pole příloh, která chcete exportovat; podporuje se vícenásobný výběr.
- Můžete zvolit, zda se má pro každý záznam vygenerovat složka.

Pravidla pojmenování souborů:

- Pokud zvolíte generování složky pro každý záznam, pravidlo pojmenování souborů je: `{Hodnota pole titulu záznamu}/{Název pole přílohy}[-{Pořadové číslo souboru}].{Přípona souboru}`.
- Pokud zvolíte negenerování složky, pravidlo pojmenování souborů je: `{Hodnota pole titulu záznamu}-{Název pole přílohy}[-{Pořadové číslo souboru}].{Přípona souboru}`.

Pořadové číslo souboru se automaticky vygeneruje, pokud pole přílohy obsahuje více příloh.

- [Pravidlo propojení](/interface-builder/actions/action-settings/linkage-rule): Dynamicky zobrazit/skrýt tlačítko;
- [Upravit tlačítko](/interface-builder/actions/action-settings/edit-button): Upravit titulek, typ a ikonu tlačítka;