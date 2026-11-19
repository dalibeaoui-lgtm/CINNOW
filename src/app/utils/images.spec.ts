import { photoMoyenne, srcsetPhoto } from './images';

describe('utils/images', () => {
  it('donne la version 800 px d’une photo', () => {
    expect(photoMoyenne('images/hero/whiplash.webp')).toBe('images/hero/800/whiplash.webp');
  });

  it('propose les 2 tailles au navigateur (srcset)', () => {
    expect(srcsetPhoto('images/hero/f1.webp')).toBe('images/hero/800/f1.webp 800w, images/hero/f1.webp 1920w');
  });
});
