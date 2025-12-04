:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rychlý start

## Konfigurace prvního pracovního postupu

Přejděte na stránku správy pluginu pro pracovní postupy z menu konfigurace pluginů v horní navigační liště:

![Vstup do správy pluginu pro pracovní postupy](https://static-docs.nocobase.com/20251027222721.png)

Rozhraní pro správu zobrazuje všechny vytvořené pracovní postupy:

![Správa pracovních postupů](https://static-docs.nocobase.com/20251027222900.png)

Klikněte na tlačítko „Nový“, vytvořte nový pracovní postup a vyberte událost kolekce:

![Vytvoření pracovního postupu](https://static-docs.nocobase.com/20251027222951.png)

Po odeslání klikněte na odkaz „Konfigurovat“ v seznamu, čímž vstoupíte do rozhraní konfigurace pracovního postupu.

![Prázdný pracovní postup](https://static-docs.nocobase.com/20251027223131.png)

Poté klikněte na kartu spouštěče, čímž otevřete panel konfigurace spouštěče. Vyberte dříve vytvořenou kolekci (např. „Články“), pro spuštění zvolte „Po přidání záznamu“ a klikněte na tlačítko „Uložit“ pro dokončení konfigurace spouštěče.

![Konfigurace spouštěče](https://static-docs.nocobase.com/20251027224735.png)

Dále můžete kliknout na tlačítko plus v pracovním postupu pro přidání uzlu do postupu. Například vyberte uzel pro výpočet, který sloučí pole „Název“ a pole „ID“ z dat spouštěče.

![Přidání uzlu pro výpočet](https://static-docs.nocobase.com/20251027224842.png)

Klikněte na kartu uzlu pro otevření panelu konfigurace uzlu. Použijte funkci pro výpočet `CONCATENATE` poskytovanou Formula.js pro sloučení polí „Název“ a „ID“. Obě pole se vkládají pomocí selektoru proměnných.

![Uzel pro výpočet používající funkce a proměnné](https://static-docs.nocobase.com/20251027224939.png)

Poté vytvořte uzel pro aktualizaci dat, který uloží výsledek do pole „Název“.

![Vytvoření uzlu pro aktualizaci dat](https://static-docs.nocobase.com/20251027232654.png)

Podobně klikněte na kartu pro otevření panelu konfigurace uzlu pro aktualizaci dat. Vyberte kolekci „Články“, pro ID aktualizovaného záznamu vyberte ID dat ze spouštěče, pro položku k aktualizaci vyberte „Název“ a pro hodnotu aktualizovaných dat vyberte výsledek z uzlu pro výpočet.

![Konfigurace uzlu pro aktualizaci dat](https://static-docs.nocobase.com/20251027232802.png)

Nakonec klikněte na přepínač „Povolit“/„Zakázat“ v panelu nástrojů v pravém horním rohu pro přepnutí pracovního postupu do povoleného stavu, aby mohl být spuštěn a proveden.

## Spuštění pracovního postupu

Vraťte se na hlavní rozhraní systému, vytvořte článek pomocí bloku článků a vyplňte název článku.

![Vytvoření dat článku](https://static-docs.nocobase.com/20251027233004.png)

Po odeslání a obnovení bloku uvidíte, že název článku byl automaticky aktualizován do formátu „Název článku + ID článku“.

![Název článku upravený pracovním postupem](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Tip}
Jelikož pracovní postupy spouštěné událostmi kolekcí jsou prováděny asynchronně, neuvidíte aktualizaci dat ihned v rozhraní po jejich odeslání. Nicméně, po krátké chvíli a obnovení stránky nebo bloku se aktualizovaný obsah zobrazí.
:::

## Zobrazení historie spuštění

Pracovní postup byl právě úspěšně spuštěn a proveden jednou. Můžete se vrátit do rozhraní správy pracovních postupů a zobrazit odpovídající historii spuštění.

![Zobrazení seznamu pracovních postupů](https://static-docs.nocobase.com/20251027233246.png)

V seznamu pracovních postupů uvidíte, že tento pracovní postup vygeneroval jednu historii spuštění. Klikněte na odkaz v počtu spuštění pro otevření záznamů historie spuštění pro odpovídající pracovní postup.

![Seznam historie spuštění pro odpovídající pracovní postup](https://static-docs.nocobase.com/20251027233341.png)

Dále klikněte na odkaz „Zobrazit“ pro vstup na stránku podrobností daného spuštění, kde uvidíte stav spuštění a výsledná data pro každý uzel.

![Podrobnosti historie spuštění pracovního postupu](https://static-docs.nocobase.com/20251027233615.png)

Kontextová data spouštěče a výsledná data spuštění uzlu lze zobrazit kliknutím na tlačítko stavu v pravém horním rohu odpovídající karty. Například si prohlédněme výsledná data uzlu pro výpočet.

![Výsledek uzlu pro výpočet](https://static-docs.nocobase.com/20251027233635.png)

Uvidíte, že výsledná data uzlu pro výpočet obsahují vypočítaný název, což jsou data, která aktualizuje následný uzel pro aktualizaci dat.

## Shrnutí

Pomocí výše uvedených kroků jsme dokončili konfiguraci a spuštění jednoduchého pracovního postupu a seznámili se s následujícími základními koncepty:

- **Pracovní postup**: Slouží k definování základních informací o postupu, včetně názvu, typu spouštěče a stavu povolení. Můžete v něm konfigurovat libovolný počet uzlů a je entitou, která nese celý postup.
- **Spouštěč**: Každý pracovní postup obsahuje jeden spouštěč, který lze nakonfigurovat s konkrétními podmínkami pro spuštění pracovního postupu. Je vstupním bodem postupu.
- **Uzel**: Uzel je instrukční jednotka v rámci pracovního postupu, která provádí konkrétní akci. Více uzlů v pracovním postupu tvoří kompletní tok provádění prostřednictvím vztahů mezi nadřazenými a podřízenými uzly.
- **Spuštění**: Spuštění je konkrétní objekt provedení po spuštění pracovního postupu, známý také jako záznam spuštění nebo historie spuštění. Obsahuje informace, jako je stav spuštění a kontextová data spouštěče. Pro každý uzel existují také odpovídající výsledky spuštění, které zahrnují stav uzlu po provedení a informace o výsledných datech.

Pro podrobnější použití se můžete dále podívat na následující obsah:

- [Spouštěče](./triggers/index)
- [Uzly](./nodes/index)
- [Použití proměnných](./advanced/variables)
- [Spuštění](./advanced/executions)
- [Správa verzí](./advanced/revisions)
- [Pokročilé možnosti](./advanced/options)