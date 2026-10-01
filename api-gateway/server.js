const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'API Gateway is running smoothly' });
});

const proxyErrorHandler = (err, req, res) => {
    console.error('Proxy Error: Target service is unreachable.', err);
    res.status(503).json({
        error: 'Service Unavailable',
        message: 'The requested microservice is currently unreachable or down.'
    });
};

app.use('/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    onError: proxyErrorHandler
}));

app.use('/products', createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    onError: proxyErrorHandler
}));

app.use('/orders', createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    onError: proxyErrorHandler
}));

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Routing /users -> ${USER_SERVICE_URL}`);
    console.log(`Routing /products -> ${PRODUCT_SERVICE_URL}`);
    console.log(`Routing /orders -> ${ORDER_SERVICE_URL}`);
});