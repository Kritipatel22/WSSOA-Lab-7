# Lab 5: Dockerizing Node.js REST API and MongoDB (Multi-Container Orchestration)

This project builds directly upon Lab 4, transitioning the local Node.js REST API and MongoDB backend into a fully containerized, multi-container architecture using Docker and Docker Compose.

## 1. Project Overview & Relation to Lab 4
While Lab 4 established the core Express.js REST API, Mongoose models, and MongoDB connection, Lab 5 focuses on deployment and reproducibility. It wraps the entire application and database into isolated containers to ensure consistent execution across any development or production environment.

## 2. Docker Installation & Verification Commands
To verify that Docker was properly installed and running on the host system, the following CLI commands were used:
- Check Docker version: `docker --version`
- Verify Docker daemon status and info: `docker info`

## 3. Dockerfile Explanation
The custom `Dockerfile` for the Node.js API utilizes a multi-step layering approach:
- **Base Image:** Uses official Node.js runtime (`node:20`).
- **Working Directory:** Sets `/app` as the default execution path inside the container.
- **Dependencies:** Copies `package.json` and `package-lock.json` first to leverage Docker layer caching, then runs `npm install`.
- **Source Code:** Copies the rest of the application files into the container.
- **Expose & Start:** Exposes port `3000` and defines the startup command (`npm start`).

## 4. Docker Image Build Command
To build the custom Docker image manually from the project root:
`docker build -t student-api-api .`

## 5. Container Run and Port Mapping
To run the Node.js container standalone with explicit port mapping:
`docker run -d -p 3000:3000 --name student-api student-api-api`

## 6. Postman API Testing
API functionality and data insertion were verified using standard REST endpoints. To test the `POST` endpoint via PowerShell:
`Invoke-RestMethod -Uri "http://localhost:3000/students" -Method Post -ContentType "application/json" -Body '{"name":"Kriti Patel","email":"kriti@example.com","course":"Computer Science","semester":5}'`
Retrieving records was verified by accessing `http://localhost:3000/students` in the browser or via Postman.

## 7. Docker Network Configuration
To allow the independent containers (`student-api` and `mongodb`) to discover and talk to each other securely, a custom bridge network (`student-network`) was configured in `compose.yaml`:
- Network configuration uses a bridge driver (`student-network`) shared across both services.

## 8. Localhost vs. MongoDB Service/Container Name
- **Standalone / Local development:** Uses `localhost` (`mongodb://localhost:27017/...`).
- **Docker Compose / Multi-container network:** Uses the service name `mongodb` as the hostname (`mongodb://mongodb:27017/...`), allowing Docker's internal DNS resolver to route traffic between containers seamlessly.

## 9. Environment Variables
Configuration is handled dynamically via environment variables passed into the container runtime. In `compose.yaml`, the database URI is mapped via:
`MONGO_URI: mongodb://mongodb:27017/campusconnect`

## 10. MongoDB Volume and Persistence Test
To prevent data loss when containers are stopped or removed, a named Docker volume (`student-mongo-data`) is mounted to MongoDB's data directory (`/data/db`).
- **Persistence Test:** Inserting records via `POST`, running `docker compose down`, restarting with `docker compose up -d`, and refreshing `/students` confirmed that all data persisted successfully.

## 11. Docker Compose Configuration and Commands
The multi-container setup is orchestrated using `compose.yaml`, managing both the `api` and `mongodb` services, networks, and volumes.
- **Start services in background:** `docker compose up --build -d`
- **Check service status:** `docker compose ps`
- **View container logs:** `docker compose logs`
- **Stop and clean up containers:** `docker compose down`

## 12. Troubleshooting Issues Encountered & Resolutions
- **Issue 1: Container Name Conflicts.** 
  - *Error:* Conflict when Docker Compose tried creating a container named `mongodb` because an old manual container was still occupying that name.
  - *Resolution:* Ran `docker rm -f mongodb student-api` to clear out conflicting legacy containers.
- **Issue 2: PowerShell Curl Argument Parsing Error.** 
  - *Error:* Standard Linux `curl` syntax with headers failed in PowerShell due to native aliasing to `Invoke-WebRequest`.
  - *Resolution:* Switched to PowerShell-native `Invoke-RestMethod` syntax for reliable `POST` request handling.
- **Issue 3: Database Connection Timeout.** 
  - *Error:* API threw connection timeouts trying to reach MongoDB due to mismatching environment variable keys (`MONGODB_URI` vs `MONGO_URI`).
  - *Resolution:* Updated `server.js` to accept `process.env.MONGO_URI` and ensured proper service hostname resolution (`mongodb://mongodb:27017/...`).