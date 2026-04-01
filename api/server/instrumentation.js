/**
 * Azure Monitor OpenTelemetry instrumentation for LibreChat.
 *
 * Must be loaded BEFORE any other code via:
 *   NODE_OPTIONS="--require ./api/server/instrumentation.js"
 *
 * Gracefully no-ops when APPLICATIONINSIGHTS_CONNECTION_STRING is not set
 * or when @azure/monitor-opentelemetry is not installed.
 */
const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
if (connectionString) {
  try {
    const { useAzureMonitor } = require('@azure/monitor-opentelemetry');
    useAzureMonitor({
      azureMonitorExporterOptions: { connectionString },
    });
    // eslint-disable-next-line no-console
    console.log('[instrumentation] Azure Monitor OpenTelemetry initialized');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[instrumentation] Failed to initialize Azure Monitor:', err.message);
  }
} else {
  // eslint-disable-next-line no-console
  console.log('[instrumentation] APPLICATIONINSIGHTS_CONNECTION_STRING not set, skipping');
}
