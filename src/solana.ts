import bs58 from "bs58";
import { ConfirmedTransaction } from "./gen/sf/solana/type/v1/type_pb.js";

export function getTransactionId(confirmedTx: ConfirmedTransaction) {
    // Make sure we have signatures
    if (!confirmedTx.transaction || !confirmedTx.transaction.signatures.length) {
      return null;
    }

    // The first signature is the transaction ID
    const firstSignature = confirmedTx.transaction.signatures[0];

    // Convert raw bytes to a Solana-friendly base58-encoded string
    return bs58.encode(firstSignature);
  }