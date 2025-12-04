---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Multimodální konverzace

## Obrázky

Pokud to model podporuje, uzel LLM může modelu odesílat obrázky. Při jeho použití je nutné vybrat pole přílohy nebo záznam související kolekce souborů prostřednictvím proměnné. Při výběru záznamu kolekce souborů jej můžete vybrat na úrovni objektu, nebo můžete vybrat pole URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Pro formát odesílání obrázků jsou k dispozici dvě možnosti:

- Odeslat přes URL – Všechny obrázky, kromě těch uložených lokálně, budou odeslány ve formě URL. Lokálně uložené obrázky budou před odesláním převedeny do formátu base64.
- Odeslat přes base64 – Všechny obrázky, ať už uložené lokálně nebo v cloudu, budou odeslány ve formátu base64. To je vhodné pro situace, kdy URL obrázku není přímo přístupné online službě LLM.

![](https://static-docs.nocobase.com/202503041200638.png)