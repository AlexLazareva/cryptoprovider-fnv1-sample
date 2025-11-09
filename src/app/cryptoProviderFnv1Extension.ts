/*
  Copyright © 2025 ASCON-Design Systems LLC. All rights reserved.
  This sample is licensed under the MIT License.
*/

import { map, Observable, of } from 'rxjs';
import {
  CadesType,
  ICertificate,
  ICryptoProvider,
  IFile,
  IImportedSignatureVerificationResult,
  IInitializable,
  InjectionSource,
  ISignatureCustomState,
  ISignatureRequest,
  ISignatureVerificationResult,
  SignatureVerificationStatus
} from '@pilotdev/pilot-web-sdk';
import { FileSignatureUpdater } from './file-signature.updater';
import { ISignatureDataObject } from "./signature-date-object.interface";
import { arrayBufferToBase64, base64DecodeUnicode, convertToString, stringToArrayBuffer } from "./utils";

export class CryptoProviderFnv1Extension implements ICryptoProvider, IInitializable {

  private readonly _signatureAlgorithm = 'fnva-1';

  private _fileSignatureUpdater!: FileSignatureUpdater;

  initialize(injectionSource: InjectionSource): void {
    this._fileSignatureUpdater = new FileSignatureUpdater(injectionSource.modifierProvider);
  }

  canProcessAlgorithms(publicKeyOid: string): boolean {
    return this._signatureAlgorithm == publicKeyOid;
  }

  canProcessSignature(signatureFile: ArrayBuffer): boolean {
    try {
      const signDecodedString = base64DecodeUnicode(convertToString(signatureFile));
      const signature: ISignatureDataObject = JSON.parse(signDecodedString);
      return signature.fileHash != '' && signature.fileHash != null;
    } catch (error) {
      return false;
    }
  }

  sign(documentId: string, actualFile: IFile, arrayBuffer: ArrayBuffer, certificate: ICertificate, signatureRequestIds: string[]): Observable<string> {
    const signature = this.getBase64String(arrayBuffer, certificate);
    return this._fileSignatureUpdater.setSignToObjectFile(documentId, actualFile, signature, certificate.publicKeyOid, signatureRequestIds)
      .pipe(map(() => signature));
  }

  verify(file: ArrayBuffer, sign: ArrayBuffer, signatureRequest: ISignatureRequest): Observable<ISignatureVerificationResult> {
    try {
      const fileHash = this.calculateFnv1aHash(file);
      const signDecodedString = base64DecodeUnicode(convertToString(sign));
      const signature: ISignatureDataObject = JSON.parse(signDecodedString);

      if (fileHash === signature.fileHash) {
        return of({
          verificationStatus: SignatureVerificationStatus.Valid,
          signDate: signature.signDate,
          issuerName: signature.issuer,
          signerName: signature.subject,
        } as ISignatureVerificationResult);
      }

      const notMatchError: string = 'The file hashes don\'t match';
      return of({
        verificationStatus: SignatureVerificationStatus.Invalid,
        signDate: signature.signDate,
        issuerName: signature.issuer,
        signerName: signature.subject,
        error: notMatchError,
      } as ISignatureVerificationResult);
    } catch (error) {
      // Пример, как установить кастомную иконку и тултип
        const state: ISignatureCustomState = {
        icon: 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQogIC5zdC1yZWR7ZmlsbDogI2ZmYjgyOTt9DQogIC5zdC13aGl0ZXtmaWxsOiNmZmZmZmY7fQ0KPC9zdHlsZT4NCjxjaXJjbGUgY2xhc3M9InN0LXJlZCIgY3g9IjgiIGN5PSI4IiByPSI3Ii8+DQo8cGF0aCBjbGFzcz0ic3Qtd2hpdGUiIGQ9Im01LjcwNyA0LjI5My0xLjQxNDEgMS40MTQxIDIuMjkzIDIuMjkzLTIuMjkzIDIuMjkzIDEuNDE0MSAxLjQxNDEgMi4yOTMtMi4yOTMgMi4yOTMgMi4yOTMgMS40MTQxLTEuNDE0MS0yLjI5My0yLjI5MyAyLjI5My0yLjI5My0xLjQxNDEtMS40MTQxLTIuMjkzIDIuMjkzLTIuMjkzLTIuMjkzeiIvPg0KPC9zdmc+DQo=',
        iconName: 'cryptoprovider-custom-error',
        title: 'Custom state error',
        description: 'Custom state error was thrown',
      };

      return of({
        verificationStatus: SignatureVerificationStatus.Error,
        error: (error as Error)?.message,
          customState: state,
        signerNameForeground: '#FF0000'
      } as ISignatureVerificationResult);
    }
  }

  verifyImportedSignature(file: ArrayBuffer, sign: ArrayBuffer): Observable<IImportedSignatureVerificationResult> {
    try {
      const fileHash = this.calculateFnv1aHash(file);
      const signDecodedString = base64DecodeUnicode(convertToString(sign));
      const signature: ISignatureDataObject = JSON.parse(signDecodedString);

      if (fileHash === signature.fileHash) {
        return of({
          verificationStatus: SignatureVerificationStatus.Valid,
          signerName: signature.subject,
          cadesType: CadesType.NotCades,
          publicKeyOid: this._signatureAlgorithm
        } as IImportedSignatureVerificationResult);
      }

      const notMatchError: string = 'The file hashes don\'t match';
      return of({
        verificationStatus: SignatureVerificationStatus.Invalid,
        signerName: signature.subject,
        error: notMatchError,
      } as IImportedSignatureVerificationResult);

    } catch (error) {
      return of({
        verificationStatus: SignatureVerificationStatus.Error,
        error: (error as Error)?.message,
        signerNameForeground: '#FF0000',
        publicKeyOid: '',
        cadesType: CadesType.NotCades
      } as IImportedSignatureVerificationResult);
    }
  }

  getCertificates(): Observable<ICertificate[]> {
    const cert = {
      issuer: "Test Certificate Issuer",
      subject: "Седов Вячеслав Иванович",
      thumbprint: "04",
      validFromDate: "01.01.2021",
      validToDate: "01.01.2030",
      publicKeyOid: "fnva-1",
    }
    return of([cert]);
  }


  private getBase64String(file: ArrayBuffer, certificate: ICertificate): string {
      const fileHash = this.calculateFnv1aHash(file);
      const object: ISignatureDataObject = {
        fileHash: fileHash,
        signDate: new Date().toISOString(),
        subject: certificate.subject,
        issuer: certificate.issuer,
        publicKeyOid: certificate.publicKeyOid,
      };
      const json = JSON.stringify(object);
      const arrayBuffer = stringToArrayBuffer(json);
      const base64 = arrayBufferToBase64(arrayBuffer);

      return base64;
  }

  private calculateFnv1aHash(arrayBuffer: ArrayBuffer): string {
    const data = new Uint8Array(arrayBuffer);
    let hash = 2166136261;
    for (let i = 0; i < data.length; i++) {
      hash ^= data[i];
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }
}