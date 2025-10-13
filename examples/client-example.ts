/**
 * Example usage of JulesClient
 * This demonstrates how to use the Jules HTTP client with retries and logging
 */

import { JulesClient } from '../src/julesClient.js';

async function main() {
  // Create a client instance
  const client = new JulesClient('https://api.example.com', {
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
  });

  console.log('=== Jules Client Examples ===\n');

  // Example 1: GET request
  console.log('1. Making a GET request...');
  const getResponse = await client.get('/users');
  console.log('GET Response:', getResponse.status);
  console.log('Data:', getResponse.data);
  console.log();

  // Example 2: POST request
  console.log('2. Making a POST request...');
  const postResponse = await client.post('/users', {
    name: 'John Doe',
    email: 'john@example.com',
  });
  console.log('POST Response:', postResponse.status);
  console.log('Data:', postResponse.data);
  console.log();

  // Example 3: PUT request
  console.log('3. Making a PUT request...');
  const putResponse = await client.put('/users/123', {
    name: 'Jane Doe',
  });
  console.log('PUT Response:', putResponse.status);
  console.log();

  // Example 4: DELETE request
  console.log('4. Making a DELETE request...');
  const deleteResponse = await client.delete('/users/123');
  console.log('DELETE Response:', deleteResponse.status);
  console.log();

  // Example 5: Custom headers
  console.log('5. Making a request with custom headers...');
  const customResponse = await client.get('/protected', {
    headers: {
      'Authorization': 'Bearer token-here',
      'X-Custom-Header': 'custom-value',
    },
  });
  console.log('Custom Headers Response:', customResponse.status);
  console.log();

  // Example 6: Error handling
  console.log('6. Handling errors...');
  const errorResponse = await client.get('/non-existent-endpoint');
  if (errorResponse.error) {
    console.log('Error occurred:', errorResponse.error);
  }
}

// Run examples
main().catch(console.error);
