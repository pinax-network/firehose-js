import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { BlockSchema } from "./src/gen/sf/solana/type/v1/type_pb.js";
import { fromBinary } from "@bufbuild/protobuf";

const FIREHOSE_PROTO_PATH = "./proto/firehose.proto";
const SOLANA_PROTO_PATH = "./proto/solana.proto";

const packageDefinition = protoLoader.loadSync(
  [FIREHOSE_PROTO_PATH, SOLANA_PROTO_PATH],
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);
// const SolanaBlock = root.lookupType("sf.solana.type.v1.Block");
const protoDescriptor: any = grpc.loadPackageDefinition(packageDefinition);

// Firehose streaming service
const firehose = protoDescriptor.sf.firehose.v2;

// Create client
const client = new firehose.Stream(
  "solana.firehose.pinax.network:443",
  grpc.credentials.createSsl(),
  {
    "grpc.keepalive_time_ms": 30000,
    "grpc.max_receive_message_length": 50241867,
  }
);

// Prepare metadata (API Key)
const metadata = new grpc.Metadata();
metadata.add("X-Api-Key", process.env.PINAX_KEY || "");

// Make request
const request = { start_block_num: -1, stop_block_num: null };
const stream = client.Blocks(request, metadata);

stream.on("data", (response: any) => {
  const anyMessage = response.block;
  if (!anyMessage) return;
  if (anyMessage.type_url === "type.googleapis.com/sf.solana.type.v1.Block") {
    const block = fromBinary(BlockSchema, anyMessage.value);
    console.log(Number(block.blockHeight.blockHeight));
  }
});
