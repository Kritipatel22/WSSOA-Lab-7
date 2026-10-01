# WSSOA Lab-7: API Gateway and Microservices

## 1. Architecture Overview & Diagram Description
This lab implements an API Gateway architectural pattern to decouple client applications from internal microservices. 
* **Architecture Flow:** Client / Postman $\rightarrow$ **API Gateway (Port 3000)** $\rightarrow$ Internal Microservices (`user-service`, `product-service`, `order-service`) $\rightarrow$ **MongoDB Atlas**.
* **Role of the Gateway:** The API Gateway acts as the single entry point for all incoming traffic. It handles reverse proxy routing using `http-proxy-middleware`, centralizes security/logging, and manages fallback responses (such as returning a `503 Service Unavailable` error) when downstream microservices are offline.

## 2. Discussion Questions

### What are the benefits of using an API Gateway?
* **Single Entry Point:** Clients only need to know a single domain or port, simplifying client-side code and configuration.
* **Decoupling:** Internal microservices can change their internal ports, network locations, or scaling topology without requiring updates to client applications.
* **Cross-Cutting Concerns:** Centralizes security (authentication/authorization), rate limiting, SSL termination, and request logging at the edge before traffic hits internal services.

### Static vs. Dynamic Service Discovery
* **Static Discovery:** Relies on hardcoded configurations or environment variables (e.g., passing `USER_SERVICE_URL` via Docker Compose or cloud environment variables). It is simple to implement for small-scale deployments but lacks flexibility when scaling instances dynamically.
* **Dynamic Discovery:** Utilizes a dedicated service registry (such as Consul, Eureka, or Kubernetes DNS). Microservices automatically register themselves upon startup and deregister upon shutdown, allowing the API Gateway to discover and load-balance healthy instances dynamically.

## 3. Deployment Steps & Cloud Setup
* **Containerization:** All services (`api-gateway`, `user-service`, `product-service`, `order-service`) are containerized using individual Dockerfiles.
* **Docker Compose:** Managed locally via `docker-compose.yml`, where internal microservices run on a private Docker network and **only the API Gateway exposes port 3000 externally**.
* **Cloud Deployment (Render):**
  1. Deployed the `user-service` and `api-gateway` as Web Services on Render using Docker runtimes.
  2. Connected the `user-service` to MongoDB Atlas using cloud environment variables (`PORT` and `MONGODB_URI`).
  3. Linked the `api-gateway` to the cloud user service using the `USER_SERVICE_URL` environment variable pointing to the public Render URL (`https://user-service-pgb8.onrender.com`).

## 4. Troubleshooting Notes
* **Cold Starts & 502/503 Errors:** Free-tier cloud instances (such as Render) spin down after periods of inactivity. The first request after a period of inactivity may experience a delay or a temporary `502 Bad Gateway` while downstream microservices wake up. Allowing 30-50 seconds for services to reach a **Live** status resolves the timeout.
* **Environment Configuration:** Ensure that internal proxy routes reference the correct environment variable keys without trailing slashes to prevent routing mismatch.

## 5. Reflection
Moving from Lab 6 to Lab 7 significantly transformed how the system is structured, operated, and consumed. In Lab 6, clients interacted directly with multiple exposed microservices and ports, increasing attack surfaces and client complexity. In Lab 7, the introduction of the API Gateway unified all ingress traffic into a single control point, enforcing strict network isolation where only the gateway is exposed to the outside world. Managing cross-container communication locally via Docker Compose and transitioning those exact setups to cloud environments highlighted the critical importance of environment-driven configuration, graceful error handling, and robust proxy middleware design.