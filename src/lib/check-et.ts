// Check.et Payment Verification API
// Docs: https://docs.check.et/api-reference/verify

const BASE_URL = "https://api.check.et/api/v1";

export const BANKS = [
  "cbe",
  "telebirr",
  /* "dashen",
   "awash",
   "boa",
   "zemen",
   "cbebirr",
   "mpesa",
   "sinqee",
   "amhara", */
] as const;

export type BankCode = (typeof BANKS)[number];

/* ---------- Types ---------- */

export interface Receipt {
  status: string;           // e.g. "completed"
  transaction_type: string; // e.g. "transfer"
  amount: number;
  currency: string;         // always "ETB"
  transaction_date: string; // ISO date
  payer_name?: string;
  payer_account?: string;
  receiver_name?: string;
  receiver_account?: string;
  description?: string;
}

export interface VerifyResult {
  success: boolean;          // true = payment confirmed
  exists: boolean;           // true = found in bank records
  duplicate: boolean;        // true = already verified this session
  message: string | null;
  data: {
    bank: string;
    bank_name: string;
    verification_id: string | null;
    transaction_number: string;
    source_url: string | null;
    verification_method: string;
    receipt: Receipt;
    existing_verification_id?: number;
    verified_at?: string;
  };
}

/* ---------- Internal helpers ---------- */

function getAuthHeaders(): Record<string, string> {
  const key = process.env.CHECK_ET_API_KEY;
  if (!key) throw new Error("CHECK_ET_API_KEY environment variable is not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function jsonRequest<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { ...getAuthHeaders() };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Check.et API error ${res.status}: ${res.statusText}`);
  return res.json() as T;
}

/* ---------- 1. Verify by transaction number ---------- */

/**
 * Verify a payment using bank + transaction number.
 * account_number required for CBE / BOA; optional for others.
 */
export async function verifyByTransactionNumber(input: {
  bank: BankCode;
  transaction_number: string;
  account_number?: string;
}): Promise<VerifyResult> {
  return jsonRequest("/verify", input);
}

/* ---------- 2. Verify by receipt URL ---------- */

/**
 * Paste a share link from the banking app (Telebirr, Dashen, Awash, etc.).
 * Check.et auto-extracts bank + transaction number — no manual parsing needed.
 */
export async function verifyByReceiptUrl(url: string, accountNumber?: string): Promise<VerifyResult> {
  return jsonRequest("/verify", {
    ...(accountNumber ? { account_number: accountNumber } : {}),
    receipt_url: url,
  });
}

/* ---------- 3. Verify by receipt file (PDF / image) ---------- */

/**
 * Upload a receipt file (PDF, JPG, PNG, WEBP).
 * For images, also pass `ocrText` with OCR'd content. Max 10 MB.
 */
export async function verifyByFile(
  file: Buffer | ArrayBuffer | Blob,
  options: {
    fileName: string;
    ocrText?: string; // required for JPG/PNG/WEBP; optional for PDF
    accountNumber?: string;
  },
): Promise<VerifyResult> {
  const formData = new FormData();
  const blob = file instanceof Blob ? file : new Blob([file as unknown as ArrayBuffer]);
  formData.append("receipt_file", blob, options.fileName);
  if (options.accountNumber) formData.append("account_number", options.accountNumber);
  if (options.ocrText) formData.append("receipt_text", options.ocrText);

  const authHeader = getAuthHeaders()["Authorization"];

  const res = await fetch(`${BASE_URL}/verify`, {
    method: "POST",
    headers: { Authorization: authHeader },
    // Don't set Content-Type here — let browser/node set it with boundary
    body: formData,
  });
  if (!res.ok) throw new Error(`Check.et API error ${res.status}: ${res.statusText}`);
  return res.json() as unknown as VerifyResult;
}
