---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Pokročilé

## Úvod

V pluginu AI asistenta můžete konfigurovat zdroje dat a přednastavit dotazy na kolekce. Tyto dotazy jsou následně odeslány jako kontext aplikace při konverzaci s AI asistentem, který pak odpovídá na základě výsledků dotazů na kolekce.

## Konfigurace zdroje dat

Přejděte na stránku konfigurace pluginu AI asistenta, klikněte na záložku `Data source`, čímž se dostanete na stránku správy zdrojů dat AI asistenta.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Klikněte na tlačítko `Add data source`, čímž se dostanete na stránku pro vytvoření zdroje dat.

První krok: Zadejte základní informace o kolekci:
- Do pole `Title` zadejte snadno zapamatovatelný název pro zdroj dat;
- V poli `Collection` vyberte zdroj dat a kolekci, které chcete použít;
- Do pole `Description` zadejte popis zdroje dat.
- Do pole `Limit` zadejte limit dotazu pro zdroj dat, abyste zabránili vrácení příliš velkého množství dat, které by překročilo kontext konverzace s AI.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Druhý krok: Vyberte pole k dotazování:

V seznamu `Fields` zaškrtněte pole, která chcete dotazovat.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Třetí krok: Nastavte podmínky dotazu:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Čtvrtý krok: Nastavte podmínky řazení:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Nakonec, před uložením zdroje dat, si můžete prohlédnout výsledky dotazu zdroje dat.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Odesílání zdrojů dat v konverzacích

V dialogovém okně AI asistenta klikněte na tlačítko `Add work context` v levém dolním rohu, vyberte `Data source` a uvidíte zdroj dat, který jste právě přidali.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Zaškrtněte zdroj dat, který chcete odeslat, a vybraný zdroj dat bude připojen k dialogovému oknu.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Po zadání vaší otázky, stejně jako při odesílání běžné zprávy, klikněte na tlačítko pro odeslání a AI asistent odpoví na základě zdroje dat.

Zdroj dat se také objeví v seznamu zpráv.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Poznámky

Zdroj dat automaticky filtruje data na základě ACL oprávnění aktuálního uživatele, zobrazuje pouze ta data, ke kterým má uživatel přístup.