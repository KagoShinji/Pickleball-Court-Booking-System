import { buildCmsImagePath, compressImageUnderLimit } from '../lib/imageCompression';
import { supabase } from '../lib/supabaseClient';
import { getCompanyId } from '../lib/config';

export const CMS_IMAGES_BUCKET = 'cms-images';

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.split('?')[0];
}

export async function uploadCmsImage(slotKey, file) {
  const compressedFile = await compressImageUnderLimit(file);
  // Prefix with company_id for per-tenant storage isolation (Option A)
  const path = `${getCompanyId()}/${buildCmsImagePath(slotKey, compressedFile)}`;

  const { error } = await supabase.storage
    .from(CMS_IMAGES_BUCKET)
    .upload(path, compressedFile, {
      contentType: compressedFile.type || 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(CMS_IMAGES_BUCKET).getPublicUrl(path);
  const fullUrl = normalizeImageUrl(urlData.publicUrl);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const relativeUrl = (supabaseUrl && fullUrl.startsWith(supabaseUrl))
    ? fullUrl.slice(supabaseUrl.length)
    : fullUrl;

  return {
    path,
    url: relativeUrl,
    size: compressedFile.size,
  };
}
