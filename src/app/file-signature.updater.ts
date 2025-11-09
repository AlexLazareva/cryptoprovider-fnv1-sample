// @ts-ignore
import { Guid, IDataObject, IModifierProvider, CadesType, IFile, ISignatureRequest } from "@pilotdev/pilot-web-sdk";
import { Observable } from "rxjs";
import { convertToArrayBuffer } from "./utils";

export class FileSignatureUpdater {
  constructor(private readonly _modifierProvider: IModifierProvider) {
  }

  setSignToObjectFile(documentId: string, actualFile: IFile, signatureBase64: string, publicKeyOid: string, signatureRequestIds: string[]): Observable<IDataObject[]> {
    const modifier = this._modifierProvider.newModifier();
    const builder = modifier.edit(documentId);

    signatureRequestIds.forEach(requestId => {

      const requestToSign = actualFile.signatureRequests.find((req: ISignatureRequest) => req.id === requestId);
        if (!requestToSign) 
          return;

        const fileId = Guid.newGuid();
        const creationDate = new Date(); // UTC;
        const fileBuffer = convertToArrayBuffer(signatureBase64);
        const file: File = new File([fileBuffer], `${actualFile.name}.${requestId}.sig`, {
          type: 'application/octet-stream' ,
          lastModified: creationDate.getUTCDate()
        });
        builder
          .addFile(fileId, file, creationDate, creationDate, creationDate)
          .setSignatures(actualFile.body.id)
            .edit(requestToSign)
            .withSign(fileId)
            .withPublicKeyOid(publicKeyOid)
            .withObjectId(documentId)
            .withLastSignCadesType(CadesType.NotCades);
    });

    return modifier.apply();
  }
}