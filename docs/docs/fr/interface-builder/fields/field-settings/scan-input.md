---
title: "Saisie par Scan"
description: "Paramètres de champ : activez la saisie par scan pour les champs de texte de formulaire et prenez en charge l’écriture des valeurs via des QR codes ou des codes-barres."
keywords: "saisie par scan,QR code,code-barres,paramètres de champ,constructeur d'interface,NocoBase"
---

# Saisie par Scan

## Présentation

La saisie par scan est utilisée pour les champs texte dans les formulaires modifiables. Après activation, un bouton de scan apparaît à droite du champ. Les utilisateurs peuvent scanner un QR code ou un code-barres, ou sélectionner une image depuis l’album pour la reconnaissance, puis écrire le résultat reconnu dans le champ courant.

Elle convient généralement à la saisie de numéros d’équipement, codes d’actifs, numéros de commande, numéros de suivi et autres contenus peu adaptés à une saisie manuelle.

## Champs pris en charge

La saisie par scan est principalement utilisée pour les champs de type texte, par exemple :

- Texte sur une seule ligne
- Numéro de mobile
- E-mail
- URL
- UUID
- Nano ID

Si le champ est en lecture seule, en mode lecture, ou ne prend pas lui-même en charge une saisie modifiable, la configuration de saisie par scan ne sera pas affichée.

## Configuration

Sélectionnez le champ correspondant dans un bloc de formulaire, ouvrez le menu de configuration du champ et recherchez `Paramètres de saisie par scan`.

Les options incluent :

- `Activer la saisie par scan` : après activation, un bouton de scan s’affiche à droite de la zone de saisie
- `Désactiver la saisie manuelle` : après activation, les utilisateurs ne peuvent écrire la valeur du champ qu’en scannant et ne peuvent plus modifier manuellement la zone de saisie

Après la désactivation de `Activer la saisie par scan`, `Désactiver la saisie manuelle` devient également inactif.

## Utilisation

Après avoir cliqué sur le bouton de scan à droite du champ, l’utilisateur peut utiliser la caméra pour reconnaître un QR code ou un code-barres. Le scan dans le navigateur nécessite l’autorisation d’accéder à la caméra. Dans un environnement mobile prenant en charge les capacités natives de scan, la capacité native du mobile sera utilisée en priorité.

S’il n’est pas pratique d’utiliser directement la caméra, l’utilisateur peut également cliquer sur `Album` pour sélectionner une image à reconnaître.
