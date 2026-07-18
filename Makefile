.PHONY: help build up down restart logs shell status clean rebuild

IMAGE := osint-labs:latest
CONTAINER := osint-labs

help:
	@echo "OSINT Labs - commandes disponibles"
	@echo ""
	@echo "  make build    Construire l'image Docker"
	@echo "  make up       Demarrer le lab (port 8080)"
	@echo "  make down     Arreter le lab"
	@echo "  make restart  Redemarrer le conteneur"
	@echo "  make logs     Suivre les logs supervisord"
	@echo "  make shell    Ouvrir un bash dans le conteneur"
	@echo "  make status   Etat des services internes"
	@echo "  make clean    Supprimer conteneur et volumes"
	@echo "  make rebuild  Rebuild complet sans cache"

build:
	docker compose build

up:
	docker compose up -d
	@echo ""
	@echo "Dashboard:         http://localhost:8080"
	@echo "Terminal integre:  bouton dans le dashboard (xterm.js)"
	@echo "SpiderFoot:        http://localhost:8080/spiderfoot/"
	@echo "Seekr (dossiers):  http://localhost:8080/seekr/web/"
	@echo "Social Analyzer:   http://localhost:8080/social-analyzer/"
	@echo "Web-Check:         http://localhost:8080/webcheck/"

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker logs -f $(CONTAINER)

shell:
	docker exec -it $(CONTAINER) bash

status:
	docker exec $(CONTAINER) supervisorctl status

clean:
	docker compose down -v

rebuild:
	docker compose build --no-cache
