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

export function toJsDate(x509Date: string): string {
  // Извлечение компонентов даты из строки
  const year = 2000 + parseInt(x509Date.slice(0, 2), 10);
  const month = parseInt(x509Date.slice(2, 4), 10) - 1; // Месяцы в JavaScript начинаются с 0
  const day = parseInt(x509Date.slice(4, 6), 10);
  const hours = parseInt(x509Date.slice(6, 8), 10);
  const minutes = parseInt(x509Date.slice(8, 10), 10);
  const seconds = parseInt(x509Date.slice(10, 12), 10);

  // Создание объекта Date
  const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  return date.toLocaleDateString();
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