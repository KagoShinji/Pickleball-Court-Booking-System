import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SECTION_CONTENT,
  DEFAULT_SITE_IMAGES,
  DEFAULT_THEME_CONFIG,
  mergeSectionContent,
  mergeSiteImages,
  mergeThemeConfig,
  normalizeImageList,
  toCssImageUrl,
} from './cmsDefaults.js';

test('mergeThemeConfig keeps defaults while applying saved theme values', () => {
  const theme = mergeThemeConfig({ primary: '#123456', secondary: '' });

  assert.equal(theme.primary, '#123456');
  assert.equal(theme.secondary, DEFAULT_THEME_CONFIG.secondary);
  assert.equal(theme.primaryDark, DEFAULT_THEME_CONFIG.primaryDark);
});

test('mergeSiteImages normalizes galleries and preserves default section backgrounds', () => {
  const images = mergeSiteImages({
    heroBackground: '/custom/hero.jpg',
    galleries: {
      hero: ['/a.jpg', '', '  /b.jpg  '],
    },
  });

  assert.deepEqual(images.galleries.hero, ['/a.jpg', '/b.jpg']);
  assert.equal(images.heroBackground, '/custom/hero.jpg');
  assert.equal(images.sectionBackgrounds.courts, DEFAULT_SITE_IMAGES.sectionBackgrounds.courts);
});

test('mergeSectionContent fills missing section copy from defaults', () => {
  const content = mergeSectionContent({
    courts: { title: 'Reserve your favorite court.' },
  });

  assert.equal(content.courts.title, 'Reserve your favorite court.');
  assert.equal(content.courts.kicker, DEFAULT_SECTION_CONTENT.courts.kicker);
  assert.equal(content.offers.title, DEFAULT_SECTION_CONTENT.offers.title);
});

test('normalizeImageList accepts comma and newline separated image paths', () => {
  assert.deepEqual(
    normalizeImageList('/one.jpg, /two.jpg\n\n/three.jpg'),
    ['/one.jpg', '/two.jpg', '/three.jpg'],
  );
});

test('toCssImageUrl escapes quoted paths for CSS custom properties', () => {
  assert.equal(toCssImageUrl('/image "quoted".jpg'), 'url("/image %22quoted%22.jpg")');
  assert.equal(toCssImageUrl(''), undefined);
});
