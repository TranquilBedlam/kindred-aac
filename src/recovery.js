// Local-only recovery helpers. No network calls or recoverable plaintext secrets.
export const validPin = pin => /^\d{4,8}$/.test(pin);
export const normalizeRecovery = code => String(code || '').replace(/[\s-]/g, '').toUpperCase();
export const validRecovery = code => /^[0-9A-F]{32}$/.test(normalizeRecovery(code));
export function createRecoveryCode(cryptoApi = crypto) {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return hex.match(/.{1,4}/g).join('-');
}
export function createSalt(cryptoApi = crypto) {
  return [...cryptoApi.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function digestSecret(secret, salt, cryptoApi = crypto) {
  const data = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await cryptoApi.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function makeRecoveryRecord(pin, cryptoApi = crypto) {
  if (!validPin(pin)) throw new Error('PIN must be 4–8 digits.');
  const code = createRecoveryCode(cryptoApi);
  const salt = createSalt(cryptoApi), recoverySalt = createSalt(cryptoApi);
  return {code, record: {salt, digest: await digestSecret(pin,salt,cryptoApi), recoverySalt,
    recoveryDigest: await digestSecret(normalizeRecovery(code),recoverySalt,cryptoApi)}};
}
export async function addRecoveryToExisting(record, cryptoApi = crypto) {
  if (!record?.salt || !record?.digest) throw new Error('No saved PIN to protect.');
  const code = createRecoveryCode(cryptoApi), recoverySalt = createSalt(cryptoApi);
  return {code, record: {...record, recoverySalt, recoveryDigest: await digestSecret(normalizeRecovery(code),recoverySalt,cryptoApi)}};
}
export async function verifyRecovery(record,code,cryptoApi = crypto) {
  if (!record?.recoverySalt || !record?.recoveryDigest || !validRecovery(code)) return false;
  return await digestSecret(normalizeRecovery(code),record.recoverySalt,cryptoApi) === record.recoveryDigest;
}
export async function resetPinWithRecovery(record,code,newPin,cryptoApi = crypto) {
  if (!validPin(newPin)) throw new Error('PIN must be 4–8 digits.');
  if (!await verifyRecovery(record,code,cryptoApi)) throw new Error('Invalid recovery code.');
  return makeRecoveryRecord(newPin,cryptoApi); // rotate old code on reset
}