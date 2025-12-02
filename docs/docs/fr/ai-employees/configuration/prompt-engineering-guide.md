:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Agent IA · Guide d'ingénierie des prompts

> De « comment écrire » à « bien écrire », ce guide vous enseigne comment rédiger des prompts de haute qualité de manière simple, stable et réutilisable.

## 1. Pourquoi les prompts sont cruciaux

Un prompt est la « description de poste » de l'agent IA, déterminant directement son style, ses limites et la qualité de ses résultats.

**Exemple comparatif :**

❌ Prompt peu clair :

```
Vous êtes un assistant d'analyse de données, aidant les utilisateurs à analyser des données.
```

✅ Prompt clair et contrôlable :

```
Vous êtes Viz, un expert en analyse de données.

Définition du rôle
- Style : Perspicace, clair, axé sur la visualisation
- Mission : Transformer des données complexes en « histoires visuelles » compréhensibles

Flux de travail
1) Comprendre les besoins
2) Générer du SQL sécurisé (utilisant uniquement SELECT)
3) Extraire des insights
4) Présenter avec des graphiques

Règles strictes
- MUST : Utiliser uniquement SELECT, ne jamais modifier les données
- ALWAYS : Produire des visualisations graphiques par défaut
- NEVER : Fabriquer ou deviner des données

Format de sortie
Brève conclusion (2-3 phrases) + JSON de graphique ECharts
```

**Conclusion** : Un bon prompt définit clairement « qui il est, ce qu'il doit faire, comment le faire et selon quelles normes », rendant les performances de l'IA stables et contrôlables.

## 2. La formule d'or des « Neuf Éléments » pour les prompts

Une structure dont l'efficacité a été prouvée en pratique :

```
Nommage + Double instruction + Confirmation simulée + Répétition + Règles strictes
+ Informations contextuelles + Renforcement positif + Exemples de référence + Exemples négatifs (facultatif)
```

### 2.1 Description des éléments

| Élément   | Problème résolu            | Pourquoi c'est efficace        |
| ---- | ----------------- | ------------ |
| Nommage   | Clarifie l'identité et le style           | Aide l'IA à développer un « sens du rôle » |
| Double instruction | Distingue « qui je suis » de « ce que je dois faire »     | Réduit la confusion de rôle       |
| Confirmation simulée | Répète la compréhension avant l'exécution            | Prévient les déviations          |
| Répétition | Les points clés apparaissent à plusieurs reprises           | Augmente la priorité        |
| Règles strictes | MUST/ALWAYS/NEVER | Établit une ligne de conduite         |
| Informations contextuelles | Connaissances et contraintes nécessaires           | Réduit les malentendus         |
| Renforcement positif | Guide les attentes et le style           | Ton et performance plus stables    |
| Exemples de référence | Fournit un modèle direct à imiter           | Le résultat est plus proche des attentes      |
| Exemples négatifs | Évite les pièges courants             | Corrige les erreurs, devenant plus précis à l'usage    |

### 2.2 Modèle de démarrage rapide

```yaml
# 1) Nommage
Vous êtes [Nom], un(e) excellent(e) [Rôle/Spécialité].

# 2) Double instruction
## Rôle
Style : [Adjectif x2-3]
Mission : [Résumé de la responsabilité principale en une phrase]

## Flux de travail de la tâche
1) Comprendre : [Point clé]
2) Exécuter : [Point clé]
3) Vérifier : [Point clé]
4) Présenter : [Point clé]

# 3) Confirmation simulée
Avant l'exécution, reformulez votre compréhension : « Je comprends que vous avez besoin de... Je réaliserai cela en... »

# 4) Répétition
Exigence principale : [1-2 points les plus critiques] (apparaître au moins deux fois au début/dans le flux de travail/à la fin)

# 5) Règles strictes
MUST : [Règle inaltérable]
ALWAYS : [Principe à toujours suivre]
NEVER : [Action explicitement interdite]

# 6) Informations contextuelles
[Connaissances du domaine/contexte/pièges courants nécessaires]

# 7) Renforcement positif
Vous excellez en [Capacité] et êtes doué(e) en [Spécialité]. Veuillez maintenir ce style pour accomplir la tâche.

# 8) Exemples de référence
[Fournir un exemple concis du « résultat idéal »]

# 9) Exemples négatifs (facultatif)
- [Mauvaise pratique] → [Bonne pratique]
```

## 3. Exemple pratique : Viz (Analyse de données)

Combinons les neuf éléments pour créer un exemple complet et « prêt à l'emploi ».

```text
# Nommage
Vous êtes Viz, un expert en analyse de données.

# Double instruction
【Rôle】
Style : Perspicace, clair, axé sur le visuel
Mission : Transformer des données complexes en « histoires visuelles »

【Flux de travail de la tâche】
1) Comprendre : Analyser les besoins en données de l'utilisateur et la portée des métriques
2) Interroger : Générer du SQL sécurisé (interroger uniquement des données réelles, SELECT-only)
3) Analyser : Extraire les insights clés (tendances/comparaisons/proportions)
4) Présenter : Choisir un graphique approprié pour une expression claire

# Confirmation simulée
Avant l'exécution, reformulez : « Je comprends que vous souhaitez analyser [objet/portée], et je présenterai les résultats via [méthode de requête et de visualisation]. »

# Répétition
Répétez : La véracité des données est la priorité, la qualité prime sur la quantité ; si aucune donnée n'est disponible, indiquez-le honnêtement.

# Règles strictes
MUST : Utiliser uniquement des requêtes SELECT, ne modifier aucune donnée
ALWAYS : Produire un graphique visuel par défaut
NEVER : Fabriquer ou deviner des données

# Informations contextuelles
- ECharts nécessite une configuration en « JSON pur », sans commentaires/fonctions
- Chaque graphique doit se concentrer sur un seul thème, éviter d'empiler plusieurs métriques

# Renforcement positif
Vous êtes doué(e) pour extraire des conclusions exploitables à partir de données réelles et les exprimer avec les graphiques les plus simples.

# Exemples de référence
Description (2-3 phrases) + JSON de graphique

Exemple de description :
Ce mois-ci, 127 nouvelles pistes ont été ajoutées, soit une augmentation de 23 % d'un mois sur l'autre, provenant principalement de canaux tiers.

Exemple de graphique :
{
  "title": {"text": "Tendance des pistes ce mois-ci"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Exemples négatifs (facultatif)
- Mélange de langues → Maintenir la cohérence linguistique
- Graphiques surchargés → Chaque graphique ne doit exprimer qu'un seul thème
- Données incomplètes → Indiquer honnêtement « Aucune donnée disponible »
```

**Points de conception**

* La « véracité » apparaît plusieurs fois dans le flux de travail, la répétition et les règles (rappel fort)
* Choisir une sortie en deux parties « description + JSON » pour une intégration facile au frontend
* Spécifier « SQL en lecture seule » pour réduire les risques

## 4. Comment améliorer les prompts au fil du temps

### 4.1 Itération en cinq étapes

```
Commencer par une version fonctionnelle → Tester à petite échelle → Noter les problèmes → Ajouter des règles/exemples pour y remédier → Tester à nouveau
```

<img src="https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-20-21.jpg" alt="Processus d'optimisation" width="50%">

Il est recommandé de tester 5 à 10 tâches typiques en une seule fois, en complétant un cycle en 30 minutes.

### 4.2 Principes et proportions

* **Privilégier l'orientation positive** : Dites d'abord à l'IA ce qu'elle doit faire
* **Amélioration basée sur les problèmes** : N'ajoutez des contraintes que lorsque des problèmes surviennent
* **Contraintes modérées** : N'accumulez pas les « interdictions » dès le départ

Ratio empirique : **80 % positif : 20 % négatif**.

### 4.3 Une optimisation typique

**Problème** : Graphiques surchargés, lisibilité médiocre
**Optimisation** :

1. Dans les « Informations contextuelles », ajoutez : un thème par graphique
2. Dans les « Exemples de référence », fournissez un « graphique à métrique unique »
3. Si le problème persiste, ajoutez une contrainte stricte dans les « Règles strictes/Répétition »

## 5. Techniques avancées

### 5.1 Utiliser XML/des balises pour une structure plus claire (recommandé pour les prompts longs)

Lorsque le contenu dépasse 1000 caractères ou peut prêter à confusion, l'utilisation de balises pour le partitionnement est plus stable :

```xml
<Rôle>Vous êtes Dex, un expert en organisation de données.</Rôle>
<Style>Méticuleux, précis et organisé.</Style>

<Tâche>
Doit être accomplie en suivant les étapes :
1. Identifier les champs clés
2. Extraire les valeurs des champs
3. Standardiser le format (Date AAAA-MM-JJ)
4. Produire du JSON
</Tâche>

<Règles>
MUST : Maintenir l'exactitude des valeurs des champs
NEVER : Deviner les informations manquantes
ALWAYS : Signaler les éléments incertains
</Règles>

<Exemple>
{"Nom":"Jean Dupont","Date":"2024-01-15","Montant":5000,"Statut":"Confirmé"}
</Exemple>
```

### 5.2 Approche hiérarchisée « Contexte + Tâche » (une manière plus intuitive)

* **Contexte** (stabilité à long terme) : Qui est cet agent, quel est son style et quelles sont ses capacités
* **Tâche** (à la demande) : Ce qu'il faut faire maintenant, quelles métriques cibler et quelle est la portée par défaut

Cela correspond naturellement au modèle « Agent + Tâche » de NocoBase : un contexte fixe avec des tâches flexibles.

### 5.3 Réutilisation modulaire

Décomposez les règles courantes en modules à combiner selon les besoins :

**Module de sécurité des données**

```
MUST : Utiliser uniquement SELECT
NEVER : Exécuter INSERT/UPDATE/DELETE
```

**Module de structure de sortie**

```
La sortie doit inclure :
1) Une brève description (2-3 phrases)
2) Le contenu principal (graphique/données/code)
3) Des suggestions facultatives (le cas échéant)
```

## 6. Règles d'or (Conclusions pratiques)

1. Un agent IA ne fait qu'un seul type de travail ; la spécialisation est plus stable
2. Les exemples sont plus efficaces que les slogans ; fournissez d'abord des modèles positifs
3. Utilisez MUST/ALWAYS/NEVER pour définir les limites
4. Adoptez une approche orientée processus pour réduire l'incertitude
5. Avancez par petites étapes, testez plus, modifiez moins et itérez continuellement
6. Ne contraignez pas trop ; évitez de « figer » le comportement
7. Consignez les problèmes et les modifications pour créer des versions
8. 80/20 : Expliquez d'abord « comment bien faire », puis contraignez « ce qu'il ne faut pas faire »

## 7. Questions fréquentes

**Q1 : Quelle est la longueur idéale ?**

* Agent de base : 500 à 800 caractères
* Agent complexe : 800 à 1500 caractères
* Non recommandé > 2000 caractères (peut ralentir et être redondant)
  Standard : Couvrir les neuf éléments, sans superflu.

**Q2 : Que faire si l'IA ne suit pas les instructions ?**

1. Utilisez MUST/ALWAYS/NEVER pour clarifier les limites
2. Répétez les exigences clés 2 à 3 fois
3. Utilisez des balises/partitions pour améliorer la structure
4. Fournissez plus d'exemples positifs, moins de principes abstraits
5. Évaluez si un modèle plus puissant est nécessaire

**Q3 : Comment équilibrer les orientations positives et négatives ?**
Rédigez d'abord les parties positives (rôle, flux de travail, exemples), puis ajoutez des contraintes basées sur les erreurs, et ne contraignez que les points qui sont « systématiquement erronés ».

**Q4 : Faut-il mettre à jour fréquemment ?**

* Contexte (identité/style/capacités principales) : Stabilité à long terme
* Tâche (scénario/métriques/portée) : Ajuster en fonction des besoins métier
* Créez une nouvelle version pour toute modification et consignez « pourquoi elle a été modifiée ».

## 8. Prochaines étapes

**Exercice pratique**

* Choisissez un rôle simple (par exemple, assistant de service client), rédigez une « version fonctionnelle » en utilisant les neuf éléments, et testez-la avec 5 tâches typiques
* Trouvez un agent existant, collectez 3 à 5 problèmes réels et effectuez une petite itération

**Lectures complémentaires**

* [Guide de configuration de l'administrateur de l'agent IA](./admin-configuration.md) : Mettre les prompts en configuration réelle
* Manuels dédiés à chaque agent IA : Consultez les modèles complets de rôles/tâches

## Conclusion

**Faites-le fonctionner, puis peaufinez-le.**
Commencez par une version « fonctionnelle », et collectez continuellement les problèmes, ajoutez des exemples et affinez les règles dans des tâches réelles.
N'oubliez pas : **Dites-lui d'abord comment bien faire les choses (orientation positive), puis contraignez-le à ne pas faire d'erreurs (restriction modérée).**