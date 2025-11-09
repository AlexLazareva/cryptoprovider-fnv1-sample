/**
 * Интерфейс для данных, которые записываются в подпись
 */
export interface ISignatureDataObject {
  fileHash: string,
  signDate: string,
  subject: string,
  issuer: string,
  publicKeyOid: string,
}