// @ts-ignore
import { Guid, IDataObject, IModifierProvider, CadesType, IFile, ISignatureRequest } from "@pilotdev/pilot-web-sdk";
import { Observable } from "rxjs";
import { convertToArrayBuffer } from "./utils";

export class FileSignatureUpdater {
  constructor(private readonly _modifierProvider: IModifierProvider) {
  }

  /**
   *
   * @param documentId
   * @param actualFile
   * @param signatureBase64
   * @param publicKeyOid
   * @param signatureRequestIds
   */
  setSignToObjectFile(documentId: string, actualFile: IFile, signatureBase64: string, publicKeyOid: string, signatureRequestIds: string[]): Observable<IDataObject[]> {
    const modifier = this._modifierProvider.newModifier();
    const builder = modifier.edit(documentId);

    signatureRequestIds.forEach(requestId => {

      const requestToSign = actualFile.signatureRequests.find((req: ISignatureRequest) => req.id === requestId);
       // проверяем наличие запроса на подпись, подписание выполняется, если он был создан
      if (!requestToSign)
          return;

        const fileId = Guid.newGuid();
        const creationDate = new Date(); // UTC;
        const fileBuffer = convertToArrayBuffer(signatureBase64);
        const file: File = new File([fileBuffer], `${actualFile.name}.${requestId}.sig`, {
          type: 'application/octet-stream' ,
          lastModified: creationDate.getUTCDate()
        });

        // вызываем IObjectBuilder и записываем информацию о подписи в IObject
        builder
          .addFile(fileId, file, creationDate, creationDate, creationDate) // добавляем файл документа в IObject
          .setSignatures(actualFile.body.id)
            .edit(requestToSign)
            .withSign(fileId)
            .withPublicKeyOid(publicKeyOid) // записываем информацию о криптопровайдере
            .withObjectId(documentId)
            .withLastSignCadesType(CadesType.NotCades); // устанавливаем формат подписи
    });

    // применяем изменения
    return modifier.apply();
  }
}