# ⚠️ ⁉️ ACTIVE DEVELOPMENT ⚠️ ⁉️

# Firehose JS SDK

## Quickstart

> Get Firehose API Key from https://pinax.network

```js
import { Blocks } from "@pinax/firehose";

// auth API token
// https://app.streamingfast.io/
// https://app.pinax.network/
if (!process.env.SUBSTREAMS_API_KEY) {
  throw new Error("SUBSTREAMS_API_KEY is require");
}

// Create client
const client = new firehose.Stream(
  "solana.firehose.pinax.network:443",
  grpc.credentials.createSsl(),
  {
    "grpc.keepalive_time_ms": 30000,
    "grpc.max_receive_message_length": 50241867,
  }
);

// gRPC Metadata
const metadata = new grpc.Metadata();
metadata.add("X-User-Agent", "@pinax/firehose");
metadata.add("X-Api-Key", process.env.SUBSTREAMS_API_KEY);

// NodeJS Events
const request = { start_block_num: -100 };
const emitter = new client.Blocks(request, metadata);

// Stream Blocks
emitter.on("data", (response) => {
  console.dir(response);
});

// End of Stream
emitter.on("close", (error) => {
  if (error) {
    console.error(error);
  }
  console.timeEnd("🆗 close");
});
```