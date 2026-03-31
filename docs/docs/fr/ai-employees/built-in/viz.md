:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Employé IA · Viz : L'analyste d'insights

> Générez des graphiques et des insights en un clic, et laissez les données parler d'elles-mêmes.

## 1. Qui est Viz

**Viz** est votre **analyste d'insights IA** intégré.
Il sait lire les données de votre page actuelle (comme les Leads, Opportunités, Comptes) et génère automatiquement des graphiques de tendances, des graphiques comparatifs, des cartes KPI et des conclusions concises, rendant l'analyse métier simple et intuitive.

Ce n'est pas un simple outil de reporting froid, mais un analyste capable de comprendre vos questions et de raconter des histoires à partir des données.

> 💡 Vous voulez savoir « pourquoi les ventes ont récemment diminué » ?
> Il vous suffit de poser une question à Viz, et il pourra vous indiquer où se situe la baisse, quelles en sont les causes possibles et quelles actions vous pouvez entreprendre.

## 2. Ce que vous pouvez faire avec Viz

| Capacité                          | Description                                      | Exemple                                           |
| :-------------------------------- | :----------------------------------------------- | :------------------------------------------------ |
| 📊 **Génération automatique de graphiques** | Visualisez les données en un clic, sans écrire de SQL | "Générez la tendance des ventes de ce mois"        |
| 🔍 **Découverte des changements et anomalies** | Analysez les raisons des hausses ou des baisses      | "En quoi ce mois est-il meilleur que le mois dernier ?" |
| 🧭 **Aide à la décision**             | Fournissez des suggestions exploitables basées sur les données | "Quel canal mérite le plus d'investissement supplémentaire ?" |
| 🧩 **Agrégation de perspectives de données** | Comparez selon plusieurs dimensions : région, produit, source | "Affichez la comparaison des revenus par région"    |

Qu'il s'agisse de bilans d'activité mensuels, du ROI des canaux ou d'entonnoirs de vente, Viz peut générer des graphiques et des interprétations en quelques secondes.

## 3. Utilisation

### 3.1 Points d'entrée sur la page

*   **Bouton en haut à droite (Recommandé)**
    Dans le coin supérieur droit des pages comme Leads, Opportunités et Comptes, cliquez sur l'**icône Viz** pour sélectionner des tâches prédéfinies, telles que :

    *   Conversion par étape et tendances
    *   Comparaison des canaux sources
    *   Analyse du bilan mensuel

    ![Exemple sur la page Leads](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

*   **Panneau global en bas à droite**
    Quelle que soit la page sur laquelle vous vous trouvez, vous pouvez faire apparaître le panneau IA global et parler directement à Viz :

    ```
    Analysez les changements de ventes des 90 derniers jours
    ```

    Viz utilisera automatiquement le contexte de données de votre page actuelle.

### 3.2 Mode d'interaction

Viz prend en charge les questions en langage naturel et peut comprendre les questions de suivi à plusieurs tours.
Exemple :

```
Salut Viz, générez la tendance des leads de ce mois.
```

```
Affichez uniquement la performance des canaux tiers.
```

```
Alors, quelle région connaît la croissance la plus rapide ?
```

Chaque question de suivi approfondira les résultats de l'analyse précédente, sans qu'il soit nécessaire de ressaisir les conditions de données.

## 4. Scénarios d'analyse courants

| Scénario                     | Ce que vous voulez savoir                                | Résultat de Viz                                     |
| :--------------------------- | :------------------------------------------------------- | :-------------------------------------------------- |
| **Bilan mensuel**            | En quoi ce mois est-il meilleur que le mois dernier ?    | Carte KPI + Graphique de tendances + Trois suggestions d'amélioration |
| **Décomposition de la croissance** | L'augmentation des revenus est-elle due à un changement de volume ou de prix ? | Graphique de décomposition des facteurs + Tableau comparatif |
| **Analyse des canaux**       | Quel canal mérite le plus d'investissement continu ?     | Graphique ROI + Courbe de rétention + Suggestions   |
| **Analyse d'entonnoir**      | Où le trafic est-il bloqué ?                             | Graphique d'entonnoir + Explication des goulots d'étranglement |
| **Rétention client**         | Quels sont les clients les plus précieux ?               | Graphique de segmentation RFM + Courbe de rétention |
| **Évaluation des promotions** | Quelle a été l'efficacité de la grande promotion ?       | Graphique comparatif + Analyse de l'élasticité des prix |

> 📈 Tous les graphiques sont générés au format ECharts valide, avec un point clé par graphique et accompagnés d'une brève conclusion.
> Si les données sont insuffisantes, Viz le précisera directement au lieu de fabriquer des résultats.

## 5. Conseils pour interagir avec Viz

| Pratique                      | Effet                                                    |
| :---------------------------- | :------------------------------------------------------- |
| ✅ Spécifiez une période          | "Les 30 derniers jours", "le mois dernier vs ce mois" pour plus de précision |
| ✅ Spécifiez les dimensions        | "Par région/canal/produit" aide à aligner les perspectives |
| ✅ Concentrez-vous sur les tendances, pas sur les détails | Viz excelle à identifier la direction des changements et les raisons clés |
| ✅ Utilisez le langage naturel     | Pas besoin de syntaxe de commande, posez simplement des questions comme si vous discutiez |

## 6. À qui s'adresse Viz ?

| Rôle                       | Utilisation                                                    |
| :------------------------- | :------------------------------------------------------------- |
| **Directeur des ventes**   | Consultez les taux de conversion par étape, la performance des canaux, les résultats de l'équipe |
| **Responsable marketing**  | Analysez le ROI des campagnes, l'efficacité des promotions, la rétention client |
| **Analyste des opérations** | Extrayez rapidement des données, détectez les anomalies, validez les hypothèses |
| **Direction**              | Comprenez l'état de l'entreprise en un coup d'œil, obtenez des signaux pour la prise de décision |

## 7. Suggestions d'utilisation

1.  **Commencez par les tâches prédéfinies**
    La démo officielle intègre des tâches courantes, vous permettant d'expérimenter les résultats directement sans avoir besoin de prompts.
    Par exemple : Page Leads → Cliquez sur **Viz → Conversion par étape et tendances**

2.  **Observez le style de sortie**
    Chaque point d'analyse est accompagné d'un graphique distinct et d'une brève description.
    Des graphiques clairs et un texte concis constituent la sortie standard de Viz.

3.  **Approfondissez progressivement vos questions**
    Après avoir lu le rapport d'analyse, continuez à demander « pourquoi » et « comment améliorer », et Viz assurera automatiquement le suivi.

## 8. Résumé

*   Viz = Votre assistant d'insights de données
*   Pas besoin d'écrire de SQL ni de configurer des graphiques
*   Obtenez un rapport d'analyse avec une seule phrase en langage naturel
*   Toutes les conclusions sont basées sur des données réelles, claires et crédibles

> Commencez par **Leads → Viz → Conversion par étape et tendances**,
> voir le premier graphique est le meilleur point de départ pour comprendre cet employé IA.