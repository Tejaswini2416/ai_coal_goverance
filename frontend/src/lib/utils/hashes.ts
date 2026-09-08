import stringify from "fast-json-stable-stringify";
import CryptoJS from "crypto-js";

/**
 * Deterministic Client Hashing Parity with FastAPI Backend
 * Matches Python: hashlib.sha256(json.dumps(payload, sort_keys=True).encode('utf-8')).hexdigest()
 */
export function computePayloadHash(payload: unknown): string {
  if (payload === null || payload === undefined) {
    return CryptoJS.SHA256("").toString(CryptoJS.enc.Hex);
  }
  const stableJson = stringify(payload);
  return CryptoJS.SHA256(stableJson).toString(CryptoJS.enc.Hex);
}

/**
 * Recomputes SHA-256 record hash along the blockchain-style ledger
 * formula: SHA256(prev_hash:sequence_number:payload_hash)
 */
export function computeRecordHash(
  prevHash: string,
  sequenceNumber: number,
  payloadHash: string
): string {
  const composite = `${prevHash}:${sequenceNumber}:${payloadHash}`;
  return CryptoJS.SHA256(composite).toString(CryptoJS.enc.Hex);
}

/**
 * Validates a list of audit ledger entries sequentially in the browser
 */
export function verifyClientLedgerChain(
  entries: Array<{
    sequence_number: number;
    prev_hash: string;
    record_hash: string;
    payload?: unknown;
  }>
): { valid: boolean; brokenAtSequence: number | null } {
  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    if (i > 0) {
      const prev = entries[i - 1];
      if (current.prev_hash !== prev.record_hash) {
        return { valid: false, brokenAtSequence: current.sequence_number };
      }
    }
  }
  return { valid: true, brokenAtSequence: null };
}
