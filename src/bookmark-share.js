function base64UrlEncodeBytes(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipCompress(bytes) {
  if (typeof CompressionStream === 'undefined') return null;
  const compressedBuffer = await new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  ).arrayBuffer();
  return new Uint8Array(compressedBuffer);
}

async function gzipDecompress(bytes) {
  if (typeof DecompressionStream === 'undefined') return null;
  const decompressedBuffer = await new Response(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  ).arrayBuffer();
  return new Uint8Array(decompressedBuffer);
}

export async function encodeSharePayload(payloadObject) {
  const json = JSON.stringify(payloadObject);
  const rawBytes = new TextEncoder().encode(json);

  try {
    const gzBytes = await gzipCompress(rawBytes);
    if (gzBytes) return `gz:${base64UrlEncodeBytes(gzBytes)}`;
  } catch {
    // fall back to raw encoding
  }

  return `b64:${base64UrlEncodeBytes(rawBytes)}`;
}

export async function decodeSharePayload(encoded) {
  if (!encoded || typeof encoded !== 'string') {
    throw new Error('Invalid share payload');
  }

  const [prefix, data] = encoded.split(':', 2);
  if (!data) throw new Error('Invalid share payload');

  if (prefix === 'gz') {
    const gzBytes = base64UrlDecodeToBytes(data);
    const rawBytes = await gzipDecompress(gzBytes);
    if (!rawBytes) throw new Error('Decompression not supported');
    const json = new TextDecoder().decode(rawBytes);
    return JSON.parse(json);
  }

  if (prefix === 'b64') {
    const rawBytes = base64UrlDecodeToBytes(data);
    const json = new TextDecoder().decode(rawBytes);
    return JSON.parse(json);
  }

  throw new Error('Unknown share payload format');
}

