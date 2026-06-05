---
pkg: '@nocobase/plugin-password-policy'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Stratégie de mot de passe

## Introduction

Définissez les règles de mot de passe, la période de validité et les politiques de sécurité de connexion pour tous les utilisateurs. Vous pouvez également gérer les comptes utilisateurs verrouillés.

## Règles de mot de passe

![](https://static-docs.nocobase.com/202412281329313.png)

### Longueur minimale du mot de passe

Définissez la longueur minimale requise pour les mots de passe. La longueur maximale est de 64 caractères.

### Exigences de complexité du mot de passe

Les options suivantes sont prises en charge :

- Doit contenir des lettres et des chiffres
- Doit contenir des lettres, des chiffres et des symboles
- Doit contenir des chiffres, des lettres majuscules et minuscules
- Doit contenir des chiffres, des lettres majuscules et minuscules, et des symboles
- Doit contenir au moins 3 des types de caractères suivants : chiffres, lettres majuscules, lettres minuscules et caractères spéciaux
- Aucune restriction

![](https://static-docs.nocobase.com/202412281331649.png)

### Le mot de passe ne peut pas contenir le nom d'utilisateur

Définissez si le mot de passe peut contenir le nom d'utilisateur de l'utilisateur actuel.

### Historique des mots de passe

Mémorisez le nombre de mots de passe récemment utilisés par l'utilisateur. L'utilisateur ne pourra pas réutiliser ces mots de passe lors d'une modification. La valeur 0 signifie aucune restriction, le nombre maximal est de 24.

## Configuration de l'expiration du mot de passe

![](https://static-docs.nocobase.com/202412281335588.png)

### Période de validité du mot de passe

Il s'agit de la période de validité du mot de passe de l'utilisateur. Les utilisateurs doivent changer leur mot de passe avant son expiration pour que la période de validité soit réinitialisée. Si le mot de passe n'est pas changé avant l'expiration, l'utilisateur ne pourra plus se connecter avec l'ancien mot de passe et devra demander à un administrateur de le réinitialiser. Si d'autres méthodes de connexion sont configurées, l'utilisateur pourra toujours se connecter en utilisant ces méthodes.

### Canal de notification d'expiration du mot de passe

Dans les 10 jours précédant l'expiration du mot de passe de l'utilisateur, un rappel est envoyé à chaque connexion de l'utilisateur. Par défaut, ce rappel est envoyé via le canal de messages internes « Rappel d'expiration de mot de passe », que vous pouvez gérer dans la section de gestion des notifications.

### Recommandations de configuration

Étant donné que l'expiration du mot de passe peut empêcher la connexion aux comptes, y compris les comptes administrateur, il est recommandé de modifier les mots de passe rapidement et de configurer plusieurs comptes dans le système ayant l'autorisation de modifier les mots de passe des utilisateurs.

## Sécurité de connexion par mot de passe

Définissez des limites pour les tentatives de connexion avec un mot de passe invalide.

![](https://static-docs.nocobase.com/202412281339724.png)

### Nombre maximal de tentatives de connexion avec un mot de passe invalide

Définissez le nombre maximal de tentatives de connexion qu'un utilisateur peut effectuer dans un intervalle de temps spécifié.

### Intervalle de temps maximal pour les tentatives de connexion invalides (secondes)

Définissez l'intervalle de temps (en secondes) utilisé pour calculer le nombre maximal de tentatives de connexion invalides par un utilisateur.

### Durée de verrouillage (secondes)

Définissez la durée pendant laquelle un utilisateur est verrouillé après avoir dépassé la limite de tentatives de connexion invalides (0 signifie aucune restriction). Pendant la période de verrouillage, l'utilisateur est interdit d'accéder au système par quelque méthode d'authentification que ce soit, y compris les clés API. Si un déverrouillage manuel est nécessaire, veuillez consulter [Verrouillage de l'utilisateur](./lockout.md).

### Scénarios

#### Aucune restriction

Aucune restriction sur le nombre de tentatives de mot de passe invalides par les utilisateurs.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Limiter la fréquence des tentatives sans verrouiller l'utilisateur

Exemple : Un utilisateur peut tenter de se connecter jusqu'à 5 fois toutes les 5 minutes.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Verrouiller l'utilisateur après avoir dépassé la limite

Exemple : Si un utilisateur effectue 5 tentatives de connexion avec un mot de passe invalide en 5 minutes, l'utilisateur est verrouillé pendant 2 heures.

![](https://static-docs.nocobase.com/202412281344952.png)

### Recommandations de configuration

- La configuration du nombre de tentatives de connexion avec un mot de passe invalide et de l'intervalle de temps est généralement utilisée pour limiter les tentatives de connexion fréquentes sur une courte période, afin de prévenir les attaques par force brute.
- La décision de verrouiller ou non l'utilisateur après avoir dépassé la limite doit être prise en fonction des scénarios d'utilisation réels. Le paramètre de durée de verrouillage peut être exploité de manière malveillante : des attaquants pourraient délibérément saisir plusieurs fois des mots de passe incorrects pour un compte cible, forçant ainsi le verrouillage du compte et le rendant inutilisable. Pour prévenir ce type d'attaque, vous pouvez combiner des restrictions d'adresse IP, des limites de fréquence d'API et d'autres mesures.
- Étant donné que le verrouillage d'un compte empêche l'accès au système, y compris pour les comptes administrateur, il est conseillé de configurer plusieurs comptes dans le système qui ont l'autorisation de déverrouiller les utilisateurs.