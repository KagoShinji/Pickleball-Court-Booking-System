import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CMS_IMAGE_MAX_BYTES,
  buildCmsImagePath,
  compressImageUnderLimit,
  formatImageSize,
} from './imageCompression.js';

function makeFile(size, name = 'Court Photo.png', type = 'image/png') {
  return new File([new Uint8Array(size)], name, { type });
}

test('buildCmsImagePath creates stable public storage paths', () => {
  const file = makeFile(1200, 'Hero Court 3.PNG', 'image/png');

  assert.equal(
    buildCmsImagePath('Hero Background', file, 1766300000000),
    'settings/hero-background-1766300000000.jpg',
  );
});

test('compressImageUnderLimit skips already-small image files', async () => {
  const file = makeFile(CMS_IMAGE_MAX_BYTES - 1, 'logo.webp', 'image/webp');

  const compressed = await compressImageUnderLimit(file, {
    imageCompression: async () => {
      throw new Error('compressor should not run');
    },
  });

  assert.equal(compressed, file);
});

test('compressImageUnderLimit retries until image is below 100KB', async () => {
  const original = makeFile(400 * 1024, 'gallery.png', 'image/png');
  const sizes = [160 * 1024, 118 * 1024, 96 * 1024];
  const qualities = [];

  const compressed = await compressImageUnderLimit(original, {
    imageCompression: async (_file, options) => {
      qualities.push(options.initialQuality);
      return makeFile(sizes.shift(), 'gallery.jpg', 'image/jpeg');
    },
  });

  assert.equal(compressed.size, 96 * 1024);
  assert.equal(compressed.type, 'image/jpeg');
  assert.deepEqual(qualities, [0.82, 0.66, 0.5]);
});

test('compressImageUnderLimit rejects non-image files', async () => {
  const file = makeFile(1024, 'notes.pdf', 'application/pdf');

  await assert.rejects(
    () => compressImageUnderLimit(file, { imageCompression: async () => file }),
    /Please choose an image file/,
  );
});

test('formatImageSize uses readable KB labels', () => {
  assert.equal(formatImageSize(102400), '100 KB');
});
