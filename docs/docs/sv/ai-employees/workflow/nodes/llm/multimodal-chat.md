---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Flerlägessamtal

## Bilder

Om modellen stöder det kan LLM-noden skicka bilder till modellen. När ni använder det behöver ni välja ett bilagefält eller en associerad filsamlingspost via en variabel. När ni väljer en filsamlingspost kan ni välja den på objektnivå eller välja URL-fältet.

![](https://static-docs.nocobase.com/202503041034858.png)

Det finns två alternativ för bildens sändningsformat:

-   **Skicka via URL** – Alla bilder, förutom de som lagras lokalt, skickas som URL:er. Lokalt lagrade bilder konverteras till base64-format innan de skickas.
-   **Skicka via base64** – Alla bilder, oavsett om de lagras lokalt eller i molnet, skickas i base64-format. Detta är lämpligt i fall där bildens URL inte kan nås direkt av LLM-tjänsten online.

![](https://static-docs.nocobase.com/202503041200638.png)