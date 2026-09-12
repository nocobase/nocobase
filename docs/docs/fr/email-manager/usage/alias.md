---
pkg: "@nocobase/plugin-email-manager"
title: "Alias d'email"
description: "Les alias d'email permettent d'envoyer des emails sous différentes identités d'expéditeur depuis le même compte email"
keywords: "alias email,identité expéditeur,Send As,Alias,NocoBase"
---

# Alias d'email

## Description fonctionnelle

Les alias d'email permettent d'envoyer des emails sous différentes identités d'expéditeur depuis le même compte email.

Lors de l'envoi, vous pouvez sélectionner l'email principal ou une adresse alias synchronisée dans le sélecteur d'expéditeur. Lors des réponses, transferts et restaurations de brouillons, le système conserve l'identité d'expéditeur d'origine.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)

> Outlook ne prend pas en charge cette fonctionnalité.

## Synchronisation des alias

Une fois l'autorisation du compte Gmail réussie, le système synchronise automatiquement les alias disponibles sur ce compte email.

Si vous ajoutez ou modifiez ultérieurement des alias dans Gmail, vous pouvez accéder aux paramètres du compte email et cliquer sur «Synchroniser les alias» dans la configuration «Nom de l'expéditeur» pour les récupérer à nouveau.

![](https://static-docs.nocobase.com/Email-settings-04-02-2026_06_04_PM.png)

## Sélectionner un alias lors de l'envoi

Dans l'éditeur d'email, cliquez sur le sélecteur d'expéditeur pour voir l'email principal et les alias synchronisés sur ce compte.

Si le même alias est associé à plusieurs comptes simultanément, le sélecteur indique également l'email principal correspondant pour aider à distinguer le contexte de compte effectivement utilisé.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)
