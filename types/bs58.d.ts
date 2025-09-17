/**
 * Type definitions for bs58
 */

declare module 'bs58' {
  /**
   * Encodes a buffer as a base58 string
   * @param source - The buffer to encode
   * @returns The base58 encoded string
   */
  export function encode(source: Buffer | Uint8Array): string;

  /**
   * Decodes a base58 string into a buffer
   * @param string - The base58 string to decode
   * @returns The decoded buffer
   */
  export function decode(string: string): Buffer;
}
