/**
 * Unit Tests: Prometheus Metrics Instrumentation
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { register, socketConnectionsActive, messagesSentTotal } = require('../src/metrics');

test('Prometheus Metrics Tests', async (t) => {
  await t.test('Metrics registry generates metrics output string', async () => {
    socketConnectionsActive.inc();
    messagesSentTotal.inc({ room_id: '1' });

    const metricsOutput = await register.metrics();
    assert.ok(typeof metricsOutput === 'string', 'Metrics output must be a string');
    assert.ok(metricsOutput.includes('chat_socket_connections_active'), 'Must contain active sockets metric');
    assert.ok(metricsOutput.includes('chat_messages_sent_total'), 'Must contain messages sent metric');
  });
});
