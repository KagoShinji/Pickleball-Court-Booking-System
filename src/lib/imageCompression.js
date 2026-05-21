export const CMS_IMAGE_MAX_BYTES = 100 * 1024;
export const CMS_IMAGE_MAX_SIZE_MB = CMS_IMAGE_MAX_BYTES / 1024 / 1024;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function slugify(value) {
  return String(value || 'cms-image')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'cms-image';
}

export function formatImageSize(bytes) {
  return `${Math.round((Number(bytes) || 0) / 1024)} KB`;
}

export function buildCmsImagePath(slotKey, _file, timestamp = Date.now()) {
  return `settings/${slugify(slotKey)}-${timestamp}.jpg`;
}

function assertImageFile(file) {
  if (!file) {
    throw new Error('Please choose an image file.');
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Please choose an image file. Supported formats are JPG, PNG, or WEBP.');
  }
}

async function loadImageCompression() {
  const { default: imageCompression } = await import('browser-image-compression');
  return imageCompression;
}

export async function compressImageUnderLimit(file, options = {}) {
  assertImageFile(file);

  const maxBytes = options.maxBytes || CMS_IMAGE_MAX_BYTES;
  if (file.size <= maxBytes) return file;

  const imageCompression = options.imageCompression || await loadImageCompression();
  let candidate = file;
  let maxWidthOrHeight = 1800;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const initialQuality = Math.max(0.18, Number((0.82 - attempt * 0.16).toFixed(2)));

    candidate = await imageCompression(file, {
      maxSizeMB: CMS_IMAGE_MAX_SIZE_MB,
      maxWidthOrHeight,
      useWebWorker: true,
      initialQuality,
      fileType: 'image/jpeg',
    });

    if (candidate.size <= maxBytes) {
      return new File([candidate], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: candidate.type || 'image/jpeg',
      });
    }

    maxWidthOrHeight = Math.max(480, Math.round(maxWidthOrHeight * 0.72));
  }

  throw new Error(`Compressed image is still ${formatImageSize(candidate.size)}. Please choose a simpler image or crop it first.`);
}
