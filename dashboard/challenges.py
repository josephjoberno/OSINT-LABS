"""Safe, bilingual practice material for the project workspace."""

CHALLENGES = [
    {
        "id": "verify-publication",
        "difficulty": "beginner",
        "category": "verification",
        "title": {"fr": "Verifier une publication", "en": "Verify a publication"},
        "objective": {"fr": "Documenter la date, la source primaire et une copie archivee d'une publication publique de votre choix.", "en": "Document the date, primary source and an archived copy of a public post of your choice."},
        "steps": {"fr": ["Choisissez une publication non sensible provenant d'une organisation.", "Retrouvez la source la plus ancienne accessible.", "Archivez la page et notez les indices qui confirment la chronologie."], "en": ["Choose a non-sensitive post published by an organization.", "Find the earliest accessible source.", "Archive the page and record the evidence supporting the timeline."]},
        "hint": {"fr": "Comparez l'horodatage, l'URL canonique et les reprises de presse.", "en": "Compare the timestamp, canonical URL and press republications."},
        "answer_label": {"fr": "Sources et conclusion", "en": "Sources and conclusion"},
    },
    {
        "id": "geolocate-landmark",
        "difficulty": "intermediate",
        "category": "geoint",
        "title": {"fr": "Geolocaliser un lieu public", "en": "Geolocate a public place"},
        "objective": {"fr": "Identifier un lieu a partir d'une image libre ou d'une partie MapCrunch sans rechercher de personne.", "en": "Identify a place from an openly licensed image or a MapCrunch round without researching a person."},
        "steps": {"fr": ["Relevez la signalisation, le marquage routier et le relief.", "Formulez trois hypotheses geographiques.", "Confirmez le lieu avec deux sources cartographiques independantes."], "en": ["Record signage, road markings and terrain.", "Form three geographic hypotheses.", "Confirm the location with two independent mapping sources."]},
        "hint": {"fr": "Les alphabets, bornes, poteaux et sens de circulation sont souvent discriminants.", "en": "Scripts, bollards, utility poles and driving side are often distinctive."},
        "answer_label": {"fr": "Lieu, coordonnees et preuves", "en": "Place, coordinates and evidence"},
    },
    {
        "id": "reverse-image-context",
        "difficulty": "intermediate",
        "category": "images",
        "title": {"fr": "Retrouver le contexte d'une image", "en": "Recover an image's context"},
        "objective": {"fr": "Retrouver la premiere occurrence verifiable d'une image de presse ou institutionnelle.", "en": "Find the earliest verifiable occurrence of a press or institutional image."},
        "steps": {"fr": ["Choisissez une image sans donnee personnelle sensible.", "Testez plusieurs recadrages en recherche inversee.", "Comparez les dates, legendes et credits puis conservez les URL."], "en": ["Choose an image without sensitive personal data.", "Try multiple crops in reverse image search.", "Compare dates, captions and credits, then retain the URLs."]},
        "hint": {"fr": "Un recadrage sur un batiment ou un logo peut produire de meilleurs resultats.", "en": "A crop focused on a building or logo may produce better results."},
        "answer_label": {"fr": "Occurrence la plus ancienne et justification", "en": "Earliest occurrence and rationale"},
    },
    {
        "id": "domain-history",
        "difficulty": "advanced",
        "category": "web",
        "title": {"fr": "Chronologie d'un domaine", "en": "Build a domain timeline"},
        "objective": {"fr": "Construire la chronologie d'un domaine de demonstration ou de votre propre organisation avec des sources passives.", "en": "Build a timeline for a demo domain or your own organization using passive sources."},
        "steps": {"fr": ["Confirmez que le domaine est autorise dans votre cadre de travail.", "Consultez les archives web, certificats publics et DNS passif disponible.", "Reliez au moins quatre evenements dates et indiquez le niveau de confiance."], "en": ["Confirm the domain is authorized within your scope.", "Review web archives, public certificates and available passive DNS.", "Connect at least four dated events and state your confidence level."]},
        "hint": {"fr": "Distinguez la date observee de la date de publication declaree.", "en": "Distinguish the observed date from the claimed publication date."},
        "answer_label": {"fr": "Chronologie sourcee", "en": "Sourced timeline"},
    },
]

RESOURCES = [
    {"name": "OSINTopia", "url": "https://challenges.osintopia.fr/", "description": {"fr": "Challenges et apprentissage OSINT en francais.", "en": "French-language OSINT challenges and learning."}},
    {"name": "OSINT UK CTF", "url": "https://ctf.osint.uk/", "description": {"fr": "Challenges OSINT avec regles et perimetre dedies.", "en": "OSINT challenges with dedicated rules and scope."}},
    {"name": "OSINT Industries CTF", "url": "https://osintindustries.ctfd.io/", "description": {"fr": "Plateforme CTF consacree aux exercices OSINT.", "en": "CTF platform dedicated to OSINT exercises."}},
    {"name": "Trace Labs", "url": "https://docs.tracelabs.org/searchparty/searchparty-participant-guide", "description": {"fr": "Guide officiel des Search Party CTF et regles d'engagement.", "en": "Official Search Party CTF guide and rules of engagement."}},
    {"name": "Bellingcat Toolkit", "url": "https://bellingcat.gitbook.io/toolkit", "description": {"fr": "Guides et outils de verification et d'enquete ouverte.", "en": "Open source verification and investigation guides and tools."}},
    {"name": "Bellingcat Challenge", "url": "https://challenge.bellingcat.com/", "description": {"fr": "Challenges officiels d'enquete en sources ouvertes.", "en": "Official open source investigation challenges."}},
    {"name": "TryHackMe OSINT", "url": "https://tryhackme.com/room/ohsint", "description": {"fr": "Salle d'initiation OSINT dans un environnement pedagogique.", "en": "Introductory OSINT room in a training environment."}},
    {"name": "HTB Academy OSINT", "url": "https://academy.hackthebox.com/course/preview/osint-corporate-recon", "description": {"fr": "Module de reconnaissance OSINT d'entreprise en laboratoire.", "en": "Corporate OSINT reconnaissance module in a lab."}},
    {"name": "GeoGuessr", "url": "https://www.geoguessr.com/", "description": {"fr": "Pratique de geolocalisation visuelle.", "en": "Visual geolocation practice."}},
    {"name": "MapCrunch", "url": "https://www.mapcrunch.com/", "description": {"fr": "Exploration aleatoire de vues de rue pour pratiquer le GEOINT.", "en": "Random street views for GEOINT practice."}},
]
