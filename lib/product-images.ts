type ImageAsset = { bytes: Uint8Array; contentType: string };
const assets = new Map<string, ImageAsset & { expires: number }>();
const MAX_BYTES = 32 * 1024 * 1024;
let cacheBytes = 0;
const imagePattern = /data:image\/(png|jpeg|jpg|webp|gif|avif);base64,([A-Za-z0-9+/]+={0,2})/g;

function remember(key: string, asset: ImageAsset) {
  if (assets.has(key) || asset.bytes.byteLength > MAX_BYTES) return;
  while (cacheBytes + asset.bytes.byteLength > MAX_BYTES && assets.size) {
    const oldest = assets.keys().next().value!;
    cacheBytes -= assets.get(oldest)!.bytes.byteLength;
    assets.delete(oldest);
  }
  assets.set(key, { ...asset, expires: Date.now() + 300_000 });
  cacheBytes += asset.bytes.byteLength;
}

export function cachedProductImage(pageId: string, hash: string): ImageAsset | undefined {
  const key = `${pageId}/${hash}`;
  const asset = assets.get(key);
  if (asset && asset.expires <= Date.now()) {
    assets.delete(key);
    cacheBytes -= asset.bytes.byteLength;
    return undefined;
  }
  return asset;
}

// Leave the database untouched. URLs can be reconstructed after a restart,
// including on read-only hosts; no dependency on deployment-local uploads.
export async function prepareProductImages(data: any, pageId: string, wantedHash?: string) {
  const replacements = new Map<string, string>();
  let requestedImage: ImageAsset | undefined;
  async function walk(value: any): Promise<any> {
    if (typeof value === 'string') {
      if (!value.includes('data:image/')) return value;
      let output = value;
      for (const match of value.matchAll(imagePattern)) {
        const source = match[0];
        let url = replacements.get(source);
        if (!url) {
          const bytes = new Uint8Array(Buffer.from(match[2], 'base64'));
          const format = match[1] === 'jpg' ? 'jpeg' : match[1];
          // Include the MIME type in the content identity.
          const identity = new TextEncoder().encode(`${format}:${match[2]}`);
          const digest = await crypto.subtle.digest('SHA-256', identity);
          const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
          const asset = { bytes, contentType: `image/${format}` };
          remember(`${pageId}/${hash}`, asset);
          if (hash === wantedHash) requestedImage = asset;
          url = `/api/product-image?page=${encodeURIComponent(pageId)}&image=${hash}`;
          replacements.set(source, url);
        }
        output = output.split(source).join(url);
      }
      return output;
    }
    if (Array.isArray(value)) return Promise.all(value.map(walk));
    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      // Sequential traversal deduplicates repeated payloads without extra copies.
      for (const [key, child] of Object.entries(value)) result[key] = await walk(child);
      return result;
    }
    return value;
  }
  return { data: await walk(data), image: requestedImage };
}
