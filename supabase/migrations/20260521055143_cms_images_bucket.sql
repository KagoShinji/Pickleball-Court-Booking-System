-- Public CMS assets used by tenant landing pages.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-images',
  'cms-images',
  true,
  102400,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_cms_images" on storage.objects;
create policy "public_read_cms_images"
on storage.objects for select
using (bucket_id = 'cms-images');

drop policy if exists "admin_insert_cms_images" on storage.objects;
create policy "admin_insert_cms_images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cms-images');
