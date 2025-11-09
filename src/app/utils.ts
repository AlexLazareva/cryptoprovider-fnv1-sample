export function convertToString(file: ArrayBuffer): string {
  let str = '';
  const bytes = new Uint8Array(file);

  for (let i = 0; i < bytes.byteLength; i++) 
    str += String.fromCharCode(bytes[i]);

  return str;
}

export function convertToArrayBuffer(base64: string): ArrayBuffer {
  const bytes = new Uint8Array(base64.length);
  for (let i = 0; i < base64.length; i++) {
    bytes[i] = base64.charCodeAt(i);
  }
  return bytes.buffer;
}

export function stringToArrayBuffer(string: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(string);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64DecodeUnicode(str: string): string {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''));
}