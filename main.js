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

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

const serverOptions = {
    key: fs.readFileSync('cert.key'),
    cert: fs.readFileSync('cert.crt')
};
const httpsServer = https.createServer(serverOptions, app);

mongoose.connect('mongodb+srv://sih:1234@safetourism.37en0mq.mongodb.net/tourist_app?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB Atlas', err));

app.use('/api/auth', authRoutes(bcrypt));

const wss = new WebSocket.Server({ server: httpsServer });

// New Red Zone endpoint to broadcast to all clients
app.post('/api/red-zone', (req, res) => {
    const { coordinates } = req.body;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'red-zone-alert', payload: { coordinates } }));
        }
    });
    res.status(200).send('Red zone broadcasted successfully.');
});

// New endpoint for broadcasting general zone data (from "Add Zone" feature)
app.post('/api/zone', (req, res) => {
    const zoneData = req.body;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'zone-alert', payload: zoneData }));
        }
    });
    res.status(200).send('Zone data broadcasted successfully.');
});


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

httpsServer.listen(port, () => {
    console.log(`Server running at https://${ipAddress}:${port}`);
});