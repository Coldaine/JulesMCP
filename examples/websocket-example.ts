/**
 * Example WebSocket client for Jules Control Room
 * This demonstrates how to connect and interact with the WebSocket server
 */

import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

// Configuration
const WS_URL = 'ws://localhost:3000/ws';
const JWT_SECRET = 'your-secret-key-change-in-production';

async function main() {
  console.log('=== Jules Control Room WebSocket Example ===\n');

  // Generate a JWT token for authentication
  const token = jwt.sign(
    { userId: 'example-user', isAdmin: false },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('1. Connecting to WebSocket server...');
  const ws = new WebSocket(`${WS_URL}?token=${token}`);

  ws.on('open', () => {
    console.log('2. Connected to server!\n');

    // Subscribe to session updates
    console.log('3. Subscribing to session updates...');
    ws.send(JSON.stringify({
      type: 'subscribe',
      sessionId: 'example-session-id',
    }));
  });

  ws.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString());
    
    console.log('\n📨 Received message:');
    console.log('   Type:', message.type);
    
    if (message.type === 'welcome') {
      console.log('   Message:', message.message);
    } else if (message.type === 'subscribed') {
      console.log('   Session ID:', message.sessionId);
    } else if (message.type === 'session-update') {
      console.log('   Session ID:', message.sessionId);
      console.log('   Diff:', JSON.stringify(message.diff, null, 2));
      console.log('   Timestamp:', message.timestamp);
    }
  });

  ws.on('error', (error: Error) => {
    console.error('\n❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('\n🔌 Connection closed');
  });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n👋 Closing connection...');
    ws.close();
    process.exit(0);
  });

  console.log('\n💡 Press Ctrl+C to disconnect\n');
}

// Run the example
main().catch(console.error);
