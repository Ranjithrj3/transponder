import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // Store last received packet & telemetry history on server
  let lastPacket: any = null;
  let packetCounter = 0;
  const connectedWsClients = new Set<WebSocket>();

  // Initialize WebSocket server attached to HTTP server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    connectedWsClients.add(ws);
    console.log(`[WebSocket] Client connected from ${req.socket.remoteAddress}. Total clients: ${connectedWsClients.size}`);

    // Send initial greeting and last packet if available
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to LoRa Ground Station Server',
      clients: connectedWsClients.size,
      lastPacket
    }));

    ws.on('message', (message: Buffer | string) => {
      try {
        const rawStr = message.toString();
        let parsedData: any = null;

        try {
          parsedData = JSON.parse(rawStr);
        } catch {
          // If raw text string
          parsedData = { type: 'TELEMETRY', raw: rawStr };
        }

        if (parsedData.type === 'TELEMETRY' && parsedData.raw) {
          packetCounter++;
          lastPacket = {
            raw: parsedData.raw,
            receivedAt: Date.now(),
            seq: packetCounter,
            port: parsedData.port || 'COM5'
          };

          // Broadcast telemetry to ALL connected Web GCS clients
          const broadcastMsg = JSON.stringify({
            type: 'TELEMETRY',
            raw: parsedData.raw,
            timestamp: Date.now(),
            serverSeq: packetCounter
          });

          connectedWsClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMsg);
            }
          });
        } else if (parsedData.type === 'HANDSHAKE') {
          console.log(`[Bridge Handshake] Client: ${parsedData.client}, Port: ${parsedData.port}, Baud: ${parsedData.baud}`);
          ws.send(JSON.stringify({ type: 'ACK', status: 'READY' }));
        }
      } catch (err) {
        console.error('[WebSocket] Error processing message:', err);
      }
    });

    ws.on('close', () => {
      connectedWsClients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Remaining: ${connectedWsClients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Socket error:', err);
      connectedWsClients.delete(ws);
    });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      wsClients: connectedWsClients.size,
      totalPacketsReceived: packetCounter,
      lastPacket,
      timestamp: new Date().toISOString()
    });
  });

  // REST fallback endpoint for sending telemetry from cURL or external scripts
  app.post('/api/telemetry', (req, res) => {
    const { raw, line } = req.body || {};
    const telemetryText = raw || line;

    if (!telemetryText) {
      return res.status(400).json({ error: 'Missing "raw" or "line" field in JSON body' });
    }

    packetCounter++;
    lastPacket = {
      raw: telemetryText,
      receivedAt: Date.now(),
      seq: packetCounter,
      source: 'HTTP_POST'
    };

    const broadcastMsg = JSON.stringify({
      type: 'TELEMETRY',
      raw: telemetryText,
      timestamp: Date.now(),
      serverSeq: packetCounter
    });

    connectedWsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    });

    return res.json({ success: true, serverSeq: packetCounter, clientsBroadcast: connectedWsClients.size });
  });

  // Download Python Bridge script
  app.get('/api/bridge-script', (req, res) => {
    const bridgePath = path.join(process.cwd(), 'bridge.py');
    if (fs.existsSync(bridgePath)) {
      res.download(bridgePath, 'bridge.py');
    } else {
      res.status(404).send('bridge.py not found');
    }
  });

  // Vite Middleware or Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[LoRa GCS Server] Running on http://${HOST}:${PORT}`);
    console.log(`[LoRa GCS Server] WebSocket endpoint at ws://${HOST}:${PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]', err);
});
