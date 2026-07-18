# OSINT Labs

OSINT Labs est un environnement local et open source pour organiser une investigation à partir de sources publiques. Il regroupe les outils, les sorties terminal, les entités découvertes, les preuves, le canvas et un assistant IA dans des projets persistés avec SQLite.

## Fonctionnalités

- projets d'investigation persistants
- exécution capturée des outils CLI avec sortie en direct
- extraction automatique des emails, URLs, domaines, IPs et téléphones
- classement automatique dans le canvas, dont une section Réseaux sociaux
- graphe de relations, notes, déplacement, masquage, zoom et panoramique
- couche de dessin pour annotations visuelles
- assistant OpenRouter conscient du contexte du projet
- recherche web OpenRouter volontaire avec sources
- Google Dork Builder avec aperçu, ouverture Google et indexation des sources citées
- Labs & Challenges bilingues avec progression SQLite par projet
- fil d'actualites sur les outils et recherches OSINT, avec sources officielles et cache SQLite
- outils OSINT pour usernames, emails, domaines, images, géolocalisation, archives et réputation
- proxy Tor isolé, jamais appliqué globalement
- stockage central SQLite sur un volume Docker

## Démarrage

Prérequis: Docker avec Docker Compose.

```bash
cp .env.example .env
```

Remplacez au minimum `FLASK_SECRET_KEY`, `OSINT_MASTER_KEY` et le mot de passe Filebrowser dans `.env`, puis lancez:

```bash
make up
```

Ouvrez [http://localhost:8080](http://localhost:8080). Le service écoute uniquement sur `127.0.0.1` par défaut.

## Parcours

1. Créez un projet avec un sujet et une cible principale.
2. Lancez un outil depuis sa carte.
3. Consultez la sortie capturée dans le terminal du runner.
4. Ouvrez le canvas pour retrouver les éléments classés automatiquement.
5. Déplacez, masquez ou annotez les éléments selon les besoins de l'enquête.
6. Configurez OpenRouter pour interroger l'assistant avec le contexte du projet.

## Google Dork Builder

Le générateur construit des requêtes avec `site:`, `filetype:`, `intitle:`, `inurl:`, expression exacte et exclusions. Il peut ouvrir la requête dans Google sans scraper le moteur.

Avec OpenRouter configuré, l'action « Rechercher et indexer » utilise la recherche web, extrait les URLs citées, conserve leur provenance et les ajoute automatiquement au projet et au canvas.

## Labs & Challenges

L'espace de pratique propose des exercices en français et en anglais avec difficulté, objectif, étapes, indice, réponse et état de complétion. La progression est enregistrée dans SQLite pour chaque projet.

Les exercices intégrés couvrent la vérification d'une publication, le GEOINT, la recherche d'image inversée et la chronologie passive d'un domaine. Des liens d'inscription et d'apprentissage sont fournis pour OSINTopia, OSINT UK CTF, OSINT Industries CTF, Trace Labs, Bellingcat, TryHackMe, Hack The Box Academy, GeoGuessr et MapCrunch.

## Sources et outils

Le catalogue inclut notamment:

- usernames: Sherlock, Maigret, Blackbird, Social Analyzer, Socialscan
- emails et compromissions: Holehe, h8mail, Have I Been Pwned, Mozilla Monitor
- domaines et web: theHarvester, Subfinder, Amass, dnsx, gau, httpx, WhatWeb
- images: Google Lens, Bing Visual Search, Yandex Images, TinEye, SauceNAO
- SOCMINT: recherche avancée X, Reddit, Meta Content Library, TGStat, WhatsMyName
- GEOINT: OpenStreetMap, Google Earth, Mapillary, SunCalc, GeoHints, NASA Worldview, EO Browser, OpenTopography, ADS-B Exchange et MarineTraffic
- vérification: urlscan.io, VirusTotal, AbuseIPDB, crt.sh et Wayback Machine
- investigation: Seekr, SpiderFoot et Recon-ng
- apprentissage: communauté, lexique et challenges francophones OSINTopia
- outils Bellingcat actifs en 2026: Auto Archiver, OSM Search, Geoclustering, ShadowFinder, AIS Imagery Search, ADS-B History, Name Variant Search, Uniform Timezone, Octosuite, Sugartrail, CouncilSearcher et RS4OSINT

Les services web externes s'ouvrent dans leur site officiel. Vérifiez leurs conditions d'utilisation avant d'envoyer une donnée personnelle ou un fichier sensible.

Les cartes `CLI` et `Terminal` correspondent à des outils installés dans l'image. Les cartes `Web` ouvrent des services externes qui ne sont pas distribués pour une installation locale. Le bouton de mise à jour couvre les paquets Ubuntu, Python, Go, les dépôts Git, Social Analyzer, Yente CLI et les modèles Nuclei, avec une progression en direct. Les images Docker séparées se mettent à jour depuis l'hôte avec `docker compose pull` puis `docker compose up -d --build`.

## Assistant IA

Chaque projet peut utiliser sa propre clé OpenRouter. La clé est chiffrée et authentifiée avant son stockage dans SQLite avec `OSINT_MASTER_KEY`, puis elle n'est jamais renvoyée au navigateur.

La recherche web est désactivée par défaut. Son activation peut entraîner des frais OpenRouter. Les actions d'outils proposées par l'assistant utilisent uniquement le catalogue autorisé et nécessitent une confirmation humaine.

## Tor

Tor fonctionne comme proxy SOCKS5 isolé dans Docker. Il n'est pas utilisé automatiquement par les outils.

```bash
curl --proxy socks5h://tor:9050 https://check.torproject.org/api/ip
```

Conservez `socks5h` afin que la résolution DNS passe par le proxy. Respectez les règles des sources consultées.

## Données

SQLite est stocké dans `/data/osint.db`. Les fichiers de travail restent organisés par projet:

```text
/data/projects/
  mon-projet-a1b2c3d4/
    meta.json
    context.json
    history.json
    exports/
    uploads/
    notes/
```

## Services

| Service | Adresse | Rôle |
| --- | --- | --- |
| Dashboard | `http://localhost:8080` | Projets, outils, canvas et assistant |
| Filebrowser | `http://localhost:8080/files/` | Fichiers des projets |
| Seekr | `http://localhost:8080/seekr/web/` | Dossiers OSINT |
| SpiderFoot | `http://localhost:8080/spiderfoot/` | Corrélation et graphe |
| Terminal | Dashboard | Shell du conteneur |

## Validation locale

```bash
python3 -m py_compile dashboard/*.py
node --check dashboard/static/js/app.js
node --check dashboard/static/js/entity-graph.js
python3 -m json.tool dashboard/tools.json >/dev/null
docker compose config >/dev/null
```

## Commandes

```bash
make up
make down
make rebuild
make shell
```

## Sécurité

Le terminal intégré donne accès à un shell dans le conteneur. Ne publiez pas directement le port sur internet. Pour un accès distant, utilisez HTTPS, une authentification forte, des contrôles réseau et un reverse proxy audité. Consultez [SECURITY.md](SECURITY.md).

Les outils de phishing, de vol de credentials, d'exploitation et de contournement ne font pas partie du projet.

## Avertissement juridique

OSINT Labs est fourni uniquement à des fins légales de recherche, de journalisme, de sécurité défensive, de vérification, de formation et d'investigation autorisée.

En utilisant ce logiciel, vous acceptez de:

- consulter uniquement des informations publiques auxquelles vous êtes légalement autorisé à accéder
- obtenir le consentement ou disposer d'une base légale lorsque la réglementation l'exige
- respecter la vie privée, les conditions d'utilisation des plateformes, le droit d'auteur et les lois applicables dans votre juridiction
- vérifier les résultats avant toute conclusion, car les correspondances peuvent être incomplètes, obsolètes ou incorrectes
- protéger les données collectées, limiter leur conservation et les supprimer lorsqu'elles ne sont plus nécessaires

Il est interdit d'utiliser OSINT Labs pour harceler, traquer, menacer, discriminer, doxer une personne, usurper une identité, contourner une protection, accéder sans autorisation à un système ou publier des données personnelles de manière abusive.

Les auteurs et contributeurs ne cautionnent aucun usage illégal ou contraire à l'éthique. Ils ne sont pas responsables des actions des utilisateurs ni des dommages résultant de l'utilisation du logiciel. Les outils et services tiers restent soumis à leurs propres licences, règles et conditions d'utilisation.

Ce document ne constitue pas un conseil juridique. En cas de doute, consultez un professionnel qualifié dans votre juridiction avant de commencer une investigation.

## Contribution

Consultez [CONTRIBUTING.md](CONTRIBUTING.md). Les contributions doivent rester dans un cadre OSINT légal, passif et respectueux de la vie privée.

## Licence

Distribué sous licence [MIT](LICENSE).
