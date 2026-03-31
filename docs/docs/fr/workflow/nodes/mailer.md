---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Envoi d'e-mails

## Introduction

Ce plugin permet d'envoyer des e-mails. Il prend en charge les contenus au format texte et HTML.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Envoi d'e-mail » :

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Configuration du nœud

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Chaque option peut utiliser des variables provenant du contexte du flux de travail. Pour les informations sensibles, vous pouvez également utiliser des variables globales et des secrets.

## Questions fréquentes

### Limite de fréquence d'envoi Gmail

Lors de l'envoi de certains e-mails, vous pourriez rencontrer l'erreur suivante :

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Cela est dû au fait que Gmail limite la fréquence des requêtes d'envoi provenant de domaines non spécifiés. Lors du déploiement de l'application, vous devez configurer le nom d'hôte du serveur pour qu'il corresponde au domaine d'envoi que vous avez lié à Gmail. Par exemple, lors d'un déploiement Docker :

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Définissez-le sur votre domaine d'envoi configuré
```

Référence : [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)