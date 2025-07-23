.PHONY: help start stop logs status sync

help: ## Show help
	@echo "Available commands:"
	@echo "  start  - Start all services"
	@echo "  stop   - Stop all services"  
	@echo "  logs   - View logs"
	@echo "  status - Check status"
	@echo "  sync   - Trigger manual sync"

start: ## Start all services
	./start.sh

stop: ## Stop all services
	docker compose down

logs: ## Show logs
	docker compose logs -f

status: ## Show status
	docker compose ps

sync: ## Trigger manual sync
	curl -X POST http://localhost:3000/api/sync
