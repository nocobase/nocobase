---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Referenční blok

## Úvod
Referenční blok zobrazí již nakonfigurovaný blok přímo na aktuální stránce, a to pouhým zadáním UID cílového bloku. Není tak potřeba blok konfigurovat znovu.

## Aktivace pluginu
Tento plugin je vestavěný, ale ve výchozím nastavení je deaktivovaný.
Otevřete „Správu pluginů“ → najděte „Blok: Reference“ → klikněte na „Povolit“.

![Enable Reference block in Plugin Manager](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Jak přidat
1) Přidejte blok → skupina „Jiné bloky“ → vyberte „Referenční blok“.  
2) V „Nastavení reference“ nakonfigurujte:
   - `Block UID`: UID cílového bloku
   - `Režim reference`: vyberte `Reference` nebo `Kopie`

![Reference block add and configure demo](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Jak získat UID bloku
- Otevřete menu nastavení cílového bloku a klikněte na `Kopírovat UID`, čímž zkopírujete jeho UID.  

![Copy UID from block settings](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Režimy a chování
- `Reference` (výchozí)
  - Sdílí stejnou konfiguraci jako původní blok; úpravy původního bloku nebo jakékoli jeho reference se synchronně projeví ve všech referencích.

- `Kopie`
  - Vytvoří nezávislý blok, který je v daném okamžiku identický s originálem; pozdější změny se mezi nimi nesynchronizují.

## Konfigurace
- Referenční blok:
  - „Nastavení reference“: slouží k určení UID cílového bloku a výběru režimu „Reference/Kopie“;
  - Zároveň se zobrazí kompletní nastavení samotného referencovaného bloku (což je ekvivalentní přímé konfiguraci původního bloku).

![Reference block settings](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Výsledek kopírování:
  - Nový blok má stejný typ jako originál a obsahuje pouze svá vlastní nastavení;
  - Již neobsahuje „Nastavení reference“.

## Chyby a náhradní stavy
- Pokud cíl chybí nebo je neplatný: zobrazí se chybový stav. Můžete jej znovu nakonfigurovat v nastavení referenčního bloku (Nastavení reference → Block UID) a po uložení se obnoví zobrazení.  

![Error state when target block is invalid](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Poznámky a omezení
- Experimentální funkce – v produkčním prostředí používejte s opatrností.
- Při kopírování může být nutné znovu nakonfigurovat některá nastavení, která závisí na UID cílového bloku.
- Všechna nastavení referenčního bloku se automaticky synchronizují, včetně konfigurací, jako je „rozsah dat“. Referenční blok však může mít vlastní [konfiguraci toku událostí](/interface-builder/event-flow/), a proto lze prostřednictvím toků událostí a vlastních JavaScriptových akcí nepřímo dosáhnout různých rozsahů dat nebo souvisejících konfigurací pro každou referenci.