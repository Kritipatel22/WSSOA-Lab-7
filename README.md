# Lab 6: Microservices Architecture with Docker & Docker Compose

## 1. Project Overview & Relationship to Previous Work
This project represents the decomposition of a monolithic web application into a decoupled microservices-based architecture. Building upon previous single-service labs, this application splits functionality into three independent, communicating microservices (User, Product, and Order), each adhering to the database-per-service design pattern.

## 2. Three Service Responsibilities and Service Boundaries
- User Service: Responsible for managing student/user profiles, registration details, and user data persistence.
- Product Service: Responsible for managing store items, product details, pricing, and inventory stock levels.
- Order Service: Responsible for processing customer purchases, calculating totals, and communicating with both the User and Product services to validate and embed related data.

## 3. Service Ports and Endpoint Mapping
All services run inside containerized environments and expose specific ports to the host machine:
- User Service: Port 3001 (POST /users, GET /users/:id)
- Product Service: Port 3002 (POST /products, GET /products/:id)
- Order Service: Port 3003 (POST /orders, GET /orders/:id)

## 4. How to Run Each Service Independently
To run any service locally outside of Docker for development:
1. Navigate into the specific service folder (e.g., cd user-service).
2. Install dependencies: npm install
3. Start the service: npm start

## 5. Dockerfile Explanation for Each Service
Each microservice contains a dedicated Dockerfile optimized for Node.js applications:
- Uses the official node base image.
- Sets the working directory inside the container (/app).
- Copies package.json and package-lock.json first to leverage Docker layer caching.
- Runs npm install to install production dependencies (including critical network and database connectors like axios and mongoose).
- Copies application source code and starts the service using CMD ["npm", "start"].

## 6. Docker Image Build Commands
To build the Docker images manually for individual services or all services together:
- Build a specific service: docker compose build user-service
- Build all services from scratch: docker compose build --no-cache

## 7. Docker Network and Service-Name Communication
All containers are attached to a custom user-defined bridge network named lab-6_campus-network. Because Docker provides automatic internal DNS resolution, services communicate with each other using their container/service names instead of hardcoded IP addresses (e.g., the Order service reaches the User service via http://user-service:3001).

## 8. Environment Variables and Service URLs
Environment variables are managed via .env files and docker-compose.yml to inject runtime configurations securely:
- PORT: Internal port the service listens on.
- MONGO_URI: Connection string pointing to the dedicated database instance.
- Inter-service URLs (USER_SERVICE_URL, PRODUCT_SERVICE_URL) pointing to respective container endpoints.

## 9. Database-per-Service / Data Ownership Approach
Following microservice best practices, each service owns its isolated database instance and schema:
- user-db for User Service data.
- product-db for Product Service data.
- order-db for Order Service data.
Services are strictly prohibited from directly querying another service's database; all cross-service data retrieval is handled via REST APIs.

## 10. Docker Compose Configuration and Commands
The compose.yaml file orchestrates all three application services and their respective databases.
Core Commands:
- Start all services in detached mode: docker compose up -d
- View running container status and port bindings: docker compose ps
- View container logs for debugging: docker compose logs -f order-service
- Stop and remove containers: docker compose down

## 11. Service-to-Service Communication Flow
When a client creates an order via POST http://localhost:3003/orders:
1. The Order Service receives the userId and productId.
2. Using Axios, the Order Service sends HTTP GET requests across the Docker network to the User Service (3001) and Product Service (3002).
3. Once valid user and product details are returned, the Order Service calculates the total price, saves the order to order-db, and returns a consolidated response containing both the order details and the embedded user/product info.

## 12. Inter-Service Error Handling Behaviour
- 404 Not Found: Triggered when an order is submitted with an invalid or non-existent userId or productId. The service catches the downstream 404 response and returns a clean validation error to the client.
- 503 Service Unavailable: Triggered if a dependent service (e.g., Product Service) is down or unreachable. The Order Service handles connection exceptions gracefully, preventing cascading failures and returning a controlled 503 status.

## 13. Postman Tests and Expected Responses
- User Creation (POST /users): Returns 201 Created with the generated MongoDB id.
- Product Creation (POST /products): Returns 201 Created with the generated product id.
- Order Creation (POST /orders): Returns 201 Created with order object and userDetails / productDetails.
- Invalid ID Test: Returns 404 Not Found.
- Dependency Down Test: Returns 503 Service Unavailable.

## 14. Troubleshooting Issues & Resolutions
- Issue (ECONNREFUSED on port 3003): Occurred when the Order Service container failed to start or bind correctly. Resolved by verifying container status with docker compose ps and restarting containers.
- Issue (MODULE_NOT_FOUND for 'axios'): Occurred because the axios dependency was missing from order-service/package.json. Resolved by adding "axios": "^1.6.0" to dependencies and rebuilding the container using docker compose up -d --build order-service.