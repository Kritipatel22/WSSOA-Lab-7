# WSSOA Lab-7: API Gateway and Microservices

## Architecture Overview
This lab implements an API Gateway pattern for microservices (`user-service`, `product-service`, `order-service`) connecting to MongoDB Atlas. 
* **Client / Postman** → **API Gateway (Render)** → **Microservices (Render)** → **MongoDB Atlas**
* The API Gateway acts as a single entry point, handling proxy routing (using `http-proxy-middleware`) and error handling (503 Service Unavailable fallback).

## Discussion Questions
1. **Benefits of an API Gateway:**
   - Centralized routing and a single entry point for clients.
   - Enhanced security, authentication, and rate limiting at the edge.
   - Decoupling internal microservice URLs and network topologies from client applications.
2. **Static vs. Dynamic Service Discovery:**
   - **Static Discovery:** Relies on hardcoded configuration or environment variables (e.g., environment variables defined in Docker Compose or Render) to map service routes. Simple to set up but less flexible when scaling.
   - **Dynamic Discovery:** Uses a dedicated service registry (like Consul or Eureka) where microservices dynamically register upon startup and deregister upon shutdown, allowing the gateway to automatically discover healthy instances.

## Cloud Deployment & Testing
* **Platform Used:** Render (Docker-based deployment).
* **Endpoints Tested:**
  - Gateway Health Check: `https://api-gateway-dxvw.onrender.com/health`
  - Gateway-Routed Users: `https://api-gateway-dxvw.onrender.com/users`

## Reflection
Moving from Lab 6 to Lab 7 significantly changed how services interact. In Lab 6, clients or tests communicated directly with individual microservices, exposing internal ports and endpoints. In Lab 7, introducing the API Gateway centralized all ingress traffic, enforcing network isolation and simplifying client requests. Furthermore, managing cross-container communication locally via Docker Compose and scaling it to cloud instances via Render highlighted the importance of robust environment variable configuration and error handling.