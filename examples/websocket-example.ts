import WebSocket from 'ws';

const WS_URL = process.env.WS_URL ?? 'ws://localhost:3001/ws';
const TOKEN = process.env.LOCAL_TOKEN ?? 'local-dev-token';

const ws = new WebSocket(WS_URL, [`bearer.${TOKEN}`]);

ws.on('open', () => {
  console.log('Connected to Jules Control Room WebSocket');
});

ws.on('message', (data) => {
  const payload = JSON.parse(data.toString());
  console.log('Δ session update:', JSON.stringify(payload, null, 2));
});

ws.on('ping', () => {
  console.log('Heartbeat received');
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed (${code}): ${reason.toString()}`);
});

ws.on('error', (error) => {
  console.error('WebSocket error', error);
});
