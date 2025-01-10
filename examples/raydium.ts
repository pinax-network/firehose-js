#!/usr/bin/env bun

import { fromBinary } from "@bufbuild/protobuf";

const RAYDIUM_PROGRAM_IDS = new Map([
  ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", "Raydium AMM Program (Liquidity Pool V4)"],
  ["CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", "Raydium CLMM Program (Uniswap V3, Raydium’s CLMM, Orca Whirlpools)"],
  ["CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", "Raydium CPMM Program (Uniswap V2, Raydium V1 AMM)"],
  ["routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS", "Raydium Router Program"],
]);

stream.on("data", (response: any) => {
  // For Firehose, you might see something like response.block or response.output.block
  const anyMessage = response.block;
  if (!anyMessage) return;
  const programs = new Set();

  if (anyMessage.type_url === "type.googleapis.com/sf.solana.type.v1.Block") {
    // decode the raw bytes using our reflection-based type
    const block = fromBinary(BlockSchema, anyMessage.value);
    const blockHeight = Number(block.blockHeight?.blockHeight);
    const timestamp = new Date(Number(block.blockTime?.timestamp) * 1000);
    const transactions = block.transactions.length;

    for ( const transaction of block.transactions) {
      const transaction_id = getTransactionId(transaction);
      const program_ids = transaction.transaction?.message?.accountKeys.map((key) => bs58.encode(key)) ?? [];
      for ( const instruction of transaction.transaction?.message?.instructions ?? []) {
        const program_id = program_ids[instruction.programIdIndex];
        programs.add(program_id);
      }
    }
    console.log(JSON.stringify({slot: Number(block.slot), timestamp: Number(new Date())}));
    // console.log(block.slot, block.blockhash);
    // console.log(JSON.stringify({block: blockHeight, program_ids: programs.size, transactions }))
  }
});


stream.on("error", (err) => {
  console.error("Stream error:", err);
});

stream.on("end", () => {
  console.log("Stream ended.");
});
