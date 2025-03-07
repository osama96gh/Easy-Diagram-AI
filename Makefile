# Makefile for Diagmarm Builder

# Variables
PYTHON := python3
PIP := $(PYTHON) -m pip
VENV := backend/.venv
VENV_ACTIVATE := $(VENV)/bin/activate
BACKEND_PORT := 5000
FRONTEND_PORT := 8000
SUPERVISOR := $(VENV)/bin/supervisord
SUPERVISORCTL := $(VENV)/bin/supervisorctl

# Default target
.PHONY: all
all: setup run

# Setup the project
.PHONY: setup
setup: setup-backend setup-supervisor

# Setup the backend
.PHONY: setup-backend
setup-backend:
	@echo "Setting up backend..."
	@if [ ! -d "$(VENV)" ]; then \
		$(PYTHON) -m venv $(VENV); \
	fi
	@. $(VENV_ACTIVATE) && $(PIP) install -r backend/requirements.txt
	@echo "Backend setup complete."

# Setup supervisor
.PHONY: setup-supervisor
setup-supervisor: setup-backend
	@echo "Setting up supervisor..."
	@if [ ! -d "logs" ]; then \
		mkdir -p logs; \
	fi
	@echo "Supervisor setup complete."

# Run the backend server
.PHONY: run-backend
run-backend:
	@echo "Starting backend server on port $(BACKEND_PORT)..."
	@. $(VENV_ACTIVATE) && cd backend && $(PYTHON) app.py

# Run the frontend server
.PHONY: run-frontend
run-frontend:
	@echo "Starting frontend server on port $(FRONTEND_PORT)..."
	@cd frontend && $(PYTHON) -m http.server $(FRONTEND_PORT)

# Run both servers (requires two terminal windows)
.PHONY: run
run:
	@echo "Please run the following commands in separate terminal windows:"
	@echo ""
	@echo "Terminal 1: make run-backend"
	@echo "Terminal 2: make run-frontend"
	@echo ""
	@echo "Or use supervisor to run both in the background:"
	@echo ""
	@echo "make start"
	@echo ""
	@echo "Then open http://localhost:$(FRONTEND_PORT) in your browser."

# Start services using supervisor
.PHONY: start
start: setup-supervisor
	@echo "Starting services using supervisor..."
	@. $(VENV_ACTIVATE) && $(SUPERVISOR) -c supervisord.conf

# Stop services
.PHONY: stop
stop:
	@echo "Stopping services..."
	@if [ -f supervisord.pid ]; then \
		. $(VENV_ACTIVATE) && $(SUPERVISORCTL) -c supervisord.conf shutdown; \
	else \
		echo "Supervisor is not running."; \
	fi

# Restart services
.PHONY: restart
restart:
	@echo "Restarting services..."
	@if [ -f supervisord.pid ]; then \
		. $(VENV_ACTIVATE) && $(SUPERVISORCTL) -c supervisord.conf restart all; \
	else \
		$(MAKE) start; \
	fi

# Check status of services
.PHONY: status
status:
	@echo "Checking service status..."
	@if [ -f supervisord.pid ]; then \
		. $(VENV_ACTIVATE) && $(SUPERVISORCTL) -c supervisord.conf status; \
	else \
		echo "Supervisor is not running."; \
	fi

# Clean up
.PHONY: clean
clean:
	@echo "Cleaning up..."
	@$(MAKE) stop || true
	@rm -rf $(VENV) logs/*.log supervisord.pid supervisor.sock
	@echo "Cleanup complete."

# Help
.PHONY: help
help:
	@echo "Makefile for Diagmarm Builder"
	@echo ""
	@echo "Available targets:"
	@echo "  all            : Setup and run the application (default)"
	@echo "  setup          : Setup the project"
	@echo "  setup-backend  : Setup the backend (create venv, install dependencies)"
	@echo "  setup-supervisor : Setup supervisor for background services"
	@echo "  run-backend    : Run the backend server in the foreground"
	@echo "  run-frontend   : Run the frontend server in the foreground"
	@echo "  run            : Instructions to run both servers"
	@echo "  start          : Start both services in the background using supervisor"
	@echo "  stop           : Stop all background services"
	@echo "  restart        : Restart all background services"
	@echo "  status         : Check status of background services"
	@echo "  clean          : Clean up (remove venv, logs, etc.)"
	@echo "  help           : Show this help message"
