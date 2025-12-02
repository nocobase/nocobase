---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Moteur de stockage : S3 (Pro)

## Introduction

S'appuyant sur le plugin de gestion de fichiers, ce plugin ajoute la prise en charge de types de stockage de fichiers compatibles avec le protocole S3. Tout service de stockage d'objets compatible avec le protocole S3 peut être facilement intégré, comme Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, etc., ce qui améliore encore la compatibilité et la flexibilité des services de stockage.

## Fonctionnalités

1. Téléchargement côté client : Le processus de téléchargement des fichiers ne passe pas par le serveur NocoBase, mais se connecte directement au service de stockage de fichiers, offrant ainsi une expérience de téléchargement plus efficace et plus rapide.
    
2. Accès privé : Lors de l'accès aux fichiers, toutes les URL sont des adresses temporaires signées et autorisées, ce qui garantit la sécurité et la validité de l'accès aux fichiers.


## Cas d'utilisation

1. **Gestion des collections de fichiers** : Gérez et stockez de manière centralisée tous les fichiers téléchargés, en prenant en charge divers types de fichiers et méthodes de stockage pour faciliter leur classification et leur récupération.
    
2. **Stockage des champs de pièces jointes** : Utilisé pour le stockage des données de pièces jointes téléchargées dans des formulaires ou des enregistrements, prenant en charge l'association avec des enregistrements de données spécifiques.
  

## Configuration du plugin

1. Activez le plugin `plugin-file-storage-s3-pro`.
    
2. Cliquez sur "Paramètres -> Gestionnaire de fichiers" pour accéder aux réglages du gestionnaire de fichiers.

3. Cliquez sur le bouton "Ajouter un nouveau" et sélectionnez "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Une fois la fenêtre contextuelle affichée, vous verrez un formulaire avec de nombreux champs à remplir. Vous pouvez vous référer à la documentation suivante pour obtenir les informations sur les paramètres pertinents pour le service de fichiers correspondant et les renseigner correctement dans le formulaire.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Configuration du fournisseur de services

### Amazon S3

#### Création du bucket

1. Ouvrez [https://ap-southeast-1.console.aws.amazon.com/s3/home](https://ap-southeast-1.console.aws.amazon.com/s3/home) pour accéder à la console S3.
    
2. Cliquez sur le bouton "Create bucket" (Créer un bucket) à droite.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Renseignez le nom du bucket (Bucket Name). Les autres champs peuvent être laissés avec leurs paramètres par défaut. Faites défiler la page jusqu'en bas et cliquez sur le bouton **"**Create**"** (Créer) pour finaliser la création.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuration CORS

1. Accédez à la liste des buckets, trouvez et cliquez sur le bucket que vous venez de créer pour accéder à sa page de détails.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Cliquez sur l'onglet "Permissions", puis faites défiler vers le bas pour trouver la section de configuration CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Saisissez la configuration suivante (vous pouvez la personnaliser davantage) et enregistrez.
    
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Obtention de l'AccessKey et du SecretAccessKey

1. Cliquez sur le bouton "Security credentials" (Identifiants de sécurité) dans le coin supérieur droit de la page.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Faites défiler vers le bas jusqu'à la section "Access Keys" (Clés d'accès) et cliquez sur le bouton "Create Access Key" (Créer une clé d'accès).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Cliquez pour accepter (ceci est une démonstration avec le compte root ; il est recommandé d'utiliser IAM dans un environnement de production).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Enregistrez l'Access key et le Secret access key affichés sur la page.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtention et configuration des paramètres

1. L'AccessKey ID et le SecretAccessKey sont les valeurs que vous avez obtenues à l'étape précédente. Veuillez les renseigner avec précision.
    
2. Accédez au panneau des propriétés de la page de détails du bucket, où vous pourrez obtenir le nom du bucket et les informations sur la région (Region).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Accès public (facultatif)

Cette configuration est facultative. Configurez-la lorsque vous avez besoin de rendre les fichiers téléchargés entièrement publics.

1. Accédez au panneau Permissions, faites défiler jusqu'à Object Ownership, cliquez sur modifier, et activez les ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Faites défiler jusqu'à Block public access, cliquez sur modifier, et configurez-le pour autoriser le contrôle des ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Cochez "Accès public" dans NocoBase.


#### Configuration des miniatures (facultatif)

Cette configuration est facultative et est utilisée pour optimiser la taille ou les effets de prévisualisation des images. **Veuillez noter que cette solution de déploiement peut entraîner des coûts supplémentaires. Pour connaître les frais spécifiques, veuillez vous référer aux conditions générales d'AWS.**

1. Visitez [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Cliquez sur le bouton `Launch in the AWS Console` (Lancer dans la console AWS) en bas de la page pour commencer le déploiement de la solution.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Suivez les invites pour compléter la configuration. Portez une attention particulière aux options suivantes :
   1. Lors de la création de la pile, vous devez spécifier le nom d'un bucket Amazon S3 contenant les images sources. Veuillez saisir le nom du bucket que vous avez créé précédemment.
   2. Si vous choisissez de déployer l'interface utilisateur de démonstration, vous pourrez tester les fonctionnalités de traitement d'image via cette interface après le déploiement. Dans la console AWS CloudFormation, sélectionnez votre pile, accédez à l'onglet "Outputs" (Sorties), trouvez la valeur correspondant à la clé DemoUrl, et cliquez sur le lien pour ouvrir l'interface de démonstration.
   3. Cette solution utilise la bibliothèque Node.js `sharp` pour un traitement efficace des images. Vous pouvez télécharger le code source depuis le dépôt GitHub et le personnaliser selon vos besoins.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Une fois la configuration terminée, attendez que le statut de déploiement passe à `CREATE_COMPLETE`.

5. Dans la configuration NocoBase, voici quelques points à noter :
   1. `Thumbnail rule` (Règle des miniatures) : Renseignez les paramètres liés au traitement d'image, par exemple `?width=100`. Pour plus de détails, consultez la [documentation AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint` (Point d'accès) : Renseignez la valeur de Outputs -> ApiEndpoint après le déploiement.
   3. `Full access URL style` (Style d'URL d'accès complet) : Vous devez cocher **Ignorer** (car le nom du bucket a déjà été renseigné lors de la configuration, il n'est plus nécessaire pour l'accès).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Création du bucket

1. Ouvrez la console OSS [https://oss.console.aliyun.com/overview](https://oss.console.aliyun.com/overview)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Cliquez sur "Buckets" dans le menu de gauche, puis sur le bouton "Create Bucket" (Créer un bucket) pour commencer la création d'un bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Renseignez les informations relatives au bucket et cliquez enfin sur le bouton "Create" (Créer).
    
    1. Le nom du bucket (Bucket Name) doit correspondre à vos besoins métier ; le nom peut être arbitraire.
        
    2. Choisissez la région (Region) la plus proche de vos utilisateurs.
        
    3. Les autres paramètres peuvent être laissés par défaut ou configurés selon vos besoins.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Configuration CORS

1. Accédez à la page de détails du bucket créé à l'étape précédente.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Cliquez sur "Content Security -> CORS" dans le menu central.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Cliquez sur le bouton "Create Rule" (Créer une règle), remplissez le contenu pertinent, faites défiler vers le bas et cliquez sur "OK". Vous pouvez vous référer à la capture d'écran ci-dessous ou configurer des paramètres plus détaillés.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Obtention de l'AccessKey et du SecretAccessKey

1. Cliquez sur "AccessKey" sous votre photo de profil dans le coin supérieur droit.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. À des fins de démonstration, nous créons une AccessKey en utilisant le compte principal. Dans un environnement de production, il est recommandé d'utiliser RAM pour la créer. Vous pouvez vous référer à [https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).
    
3. Cliquez sur le bouton "Create AccessKey" (Créer une clé d'accès).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Effectuez la vérification du compte.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Enregistrez l'Access key et le Secret access key affichés sur la page.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Obtention et configuration des paramètres

1. L'AccessKey ID et le SecretAccessKey sont les valeurs obtenues à l'étape précédente.
    
2. Accédez à la page de détails du bucket pour obtenir le nom du bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Faites défiler vers le bas pour obtenir la région (Region) (le suffixe ".aliyuncs.com" n'est pas nécessaire).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Obtenez l'adresse du point d'accès (endpoint) et ajoutez le préfixe https:// lorsque vous la renseignez dans NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuration des miniatures (facultatif)

Cette configuration est facultative et ne doit être utilisée que lorsque vous avez besoin d'optimiser la taille ou les effets de prévisualisation des images.

1. Renseignez les paramètres liés à la `Thumbnail rule` (règle des miniatures). Pour les réglages spécifiques des paramètres, consultez les [paramètres de traitement d'image](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. Les champs `Full upload URL style` (Style d'URL de téléchargement complet) et `Full access URL style` (Style d'URL d'accès complet) peuvent être identiques.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Création du bucket

1. Cliquez sur le menu "Buckets" à gauche -> cliquez sur "Create Bucket" (Créer un bucket) pour accéder à la page de création.
2. Après avoir renseigné le nom du bucket, cliquez sur le bouton "Enregistrer".
#### Obtention de l'AccessKey et du SecretAccessKey

1. Accédez à "Access Keys" (Clés d'accès) -> cliquez sur le bouton "Create access key" (Créer une clé d'accès) pour accéder à la page de création.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Cliquez sur le bouton "Enregistrer".

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Enregistrez l'Access Key et le Secret Key de la fenêtre contextuelle pour une utilisation ultérieure dans la configuration.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuration des paramètres

1. Accédez à la page NocoBase -> Gestionnaire de fichiers.

2. Cliquez sur le bouton "Ajouter un nouveau" et sélectionnez "S3 Pro".

3. Remplissez le formulaire :
   - **AccessKey ID** et **AccessKey Secret** sont les valeurs enregistrées à l'étape précédente.
   - **Region** : Une instance MinIO auto-hébergée n'a pas de concept de région, vous pouvez donc la configurer sur "auto".
   - **Endpoint** : Renseignez le nom de domaine ou l'adresse IP de votre déploiement.
   - Le champ `Full access URL style` (Style d'URL d'accès complet) doit être défini sur "Path-Style".

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Vous pouvez vous référer à la configuration des services de fichiers mentionnés ci-dessus, la logique étant similaire.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Vous pouvez vous référer à la configuration des services de fichiers mentionnés ci-dessus, la logique étant similaire.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414154500264.png)