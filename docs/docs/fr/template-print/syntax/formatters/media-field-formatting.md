---
title: "Impression par modèle - Formatage des champs média"
description: "Formateurs de champs média pour l'impression par modèle : attachment et signature permettent d'afficher les images des pièces jointes et les images de signature manuscrite dans les modèles."
keywords: "impression par modèle,champs média,attachment,signature,NocoBase"
---

### Formatage des champs média

#### 1. :attachment

##### Explication de la syntaxe

Affiche l'image d'un champ pièce jointe. Vous pouvez généralement copier la variable directement depuis la «liste des champs».

##### Exemple

```text
{d.contractFiles[0].id:attachment()}
```

##### Résultat

Affiche l'image de la pièce jointe correspondante.

#### 2. :signature

##### Explication de la syntaxe

Affiche l'image de signature associée à un champ de signature manuscrite. Vous pouvez généralement copier la variable directement depuis la «liste des champs».

##### Exemple

```text
{d.customerSignature:signature()}
```

##### Résultat

Affiche l'image de signature manuscrite correspondante.

> **Note :** pour les champs pièce jointe et les champs de signature manuscrite, il est recommandé de copier la variable directement depuis la liste des champs de la «configuration du modèle», afin d'éviter les erreurs de saisie manuelle.
