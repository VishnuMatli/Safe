const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const authRoutes = require('./auth');

const app = express();
const port = 3000;
const ipAddress = '100.76.187.58';

// Middleware
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// This line is crucial: it serves files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up HTTPS server options
const serverOptions = {
    key: fs.readFileSync('cert.key'),
    cert: fs.readFileSync('cert.crt')
};

const httpsServer = https.createServer(serverOptions, app);

// MongoDB connection
mongoose.connect('mongodb+srv://sih:1234@safetourism.37en0mq.mongodb.net/tourist_app?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB Atlas', err));

// Pass bcrypt to authRoutes for authentication
app.use('/api/auth', authRoutes(bcrypt));

// WebSocket server attached to the HTTPS server
const wss = new WebSocket.Server({ server: httpsServer });

// WebSocket logic
wss.on('connection', ws => {
    console.log('New client connected');
    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'sos-alert') {
                console.log(`SOS Alert received from ${data.payload.id}. Broadcasting to all clients.`);
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });
});

// Start the combined HTTPS/WebSocket server
httpsServer.listen(port, () => {
    console.log(`Server running at https://${ipAddress}:${port}`);
});