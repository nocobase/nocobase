---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# HTTP Odpověď

## Úvod

Tento uzel je podporován pouze v synchronních pracovních postupech Webhook a slouží k odesílání odpovědí systémům třetích stran. Například při zpracování platební zpětné vazby, pokud obchodní proces vykazuje neočekávaný výsledek (např. chybu nebo selhání), můžete pomocí uzlu odpovědi vrátit chybovou odpověď systému třetí strany. To umožní některým systémům třetích stran provést pozdější opakování na základě stavu.

Kromě toho, spuštění uzlu odpovědi ukončí provádění pracovního postupu a následné uzly již nebudou spuštěny. Pokud v celém pracovním postupu není nakonfigurován žádný uzel odpovědi, systém automaticky odpoví na základě stavu provedení postupu: vrátí `200` pro úspěšné provedení a `500` pro neúspěšné provedení.

## Vytvoření uzlu odpovědi

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v postupu a přidejte uzel „Odpověď“:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Konfigurace odpovědi

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

V těle odpovědi můžete použít proměnné z kontextu pracovního postupu.