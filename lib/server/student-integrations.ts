import {AppError} from './api'
/** Implement with a PRIVATE bucket, server-generated keys and short-lived downloads.
 * Revalidate file bytes/magic, scan malware before promotion; metadata alone is not proof.
 * No adapter is enabled until upload, quarantine and ownership tests pass. */
export interface PrivateStudentStorage { put(key:string,bytes:Uint8Array,mime:string):Promise<void>; download(key:string):Promise<{url:string;expiresAt:Date}> }
export function studentStorage():PrivateStudentStorage {throw new AppError('STORAGE_UNAVAILABLE','Private file storage is not configured. Contact student services.',503)}
/** Provider implementation must verify signed webhooks, amount/currency/invoice and
 * idempotency before recording payment. Never settle from a browser redirect. */
export interface StudentPaymentGateway {checkout(invoiceId:string,amountMinor:number,currency:string):Promise<{url:string}>}
export function studentPaymentGateway():StudentPaymentGateway {throw new AppError('PAYMENTS_UNAVAILABLE','Online payments are not configured. Contact the accounts office.',503)}
