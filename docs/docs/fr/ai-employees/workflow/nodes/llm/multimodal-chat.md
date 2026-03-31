---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Conversation multimodale

## Images

Si le modèle le prend en charge, le nœud LLM peut envoyer des images au modèle. Pour ce faire, vous devez sélectionner un champ de pièce jointe ou un enregistrement de collection de fichiers associé via une variable. Lorsque vous sélectionnez un enregistrement de collection de fichiers, vous pouvez le sélectionner au niveau de l'objet ou choisir le champ URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Deux options sont disponibles pour le format d'envoi des images :

- Envoyer via URL - Toutes les images, à l'exception de celles stockées localement, seront envoyées sous forme d'URL. Les images stockées localement seront converties au format base64 avant l'envoi.
- Envoyer via base64 - Toutes les images, qu'elles soient stockées localement ou dans le cloud, seront envoyées au format base64. Cette option est adaptée aux situations où l'URL de l'image ne peut pas être directement accessible par le service LLM en ligne.

![](https://static-docs.nocobase.com/202503041200638.png)