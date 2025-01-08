#!/usr/bin/env bun

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { Block, BlockSchema, ConfirmedTransaction, InnerInstructionSchema } from "./src/gen/solana_pb";
import { create, toBinary, toJson, fromBinary } from "@bufbuild/protobuf";
import bs58 from "bs58";


const RAYDIUM_PROGRAM_IDS = new Map([
  ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", "Raydium AMM Program (Liquidity Pool V4)"],
  ["CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", "Raydium CLMM Program (Uniswap V3, Raydium’s CLMM, Orca Whirlpools)"],
  ["CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", "Raydium CPMM Program (Uniswap V2, Raydium V1 AMM)"],
  ["routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS", "Raydium Router Program"],
]);

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
const request = { start_block_num: -100 };
const stream = client.Blocks(request, metadata);

stream.on("data", (response) => {
  // For Firehose, you might see something like response.block or response.output.block
  const anyMessage = response.block;
  if (!anyMessage) return;

  if (anyMessage.type_url === "type.googleapis.com/sf.solana.type.v1.Block") {
    // decode the raw bytes using our reflection-based type
    const block = fromBinary(BlockSchema, anyMessage.value);

    for ( const transaction of block.transactions) {
      const transaction_id = getTransactionId(transaction);
      const program_ids = transaction.transaction?.message?.accountKeys.map((key) => bs58.encode(key)) ?? [];
      for ( const instruction of transaction.transaction?.message?.instructions ?? []) {
        // console.log(instruction.instructions[0].);
        const progam_id = program_ids[instruction.programIdIndex];
        const label = RAYDIUM_PROGRAM_IDS.get(progam_id);
        if ( !label) {
          continue;
        }
        console.log({label, progam_id, transaction_id, block: block.blockHeight});
      }
    }
  }
});

stream.on("error", (err) => {
  console.error("Stream error:", err);
});

stream.on("end", () => {
  console.log("Stream ended.");
});

function getTransactionId(confirmedTx: ConfirmedTransaction) {
  // Make sure we have signatures
  if (!confirmedTx.transaction || !confirmedTx.transaction.signatures.length) {
    return null;
  }

  // The first signature is the transaction ID
  const firstSignature = confirmedTx.transaction.signatures[0];

  // Convert raw bytes to a Solana-friendly base58-encoded string
  return bs58.encode(firstSignature);
}