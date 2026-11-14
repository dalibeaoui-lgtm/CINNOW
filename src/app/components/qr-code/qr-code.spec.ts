import { TestBed } from '@angular/core/testing';
import { QrCode } from './qr-code';

// Faux QR code des e-billets
describe('components/QrCode', () => {
  const dessin = async (numero: number) => {
    const fixture = TestBed.createComponent(QrCode);
    fixture.componentRef.setInput('numero', numero);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('path')?.getAttribute('d') ?? '';
  };

  it('dessine des cases noires', async () => {
    expect((await dessin(48213)).length).toBeGreaterThan(100);
  });

  it('donne toujours le même dessin pour un même billet', async () => {
    expect(await dessin(48213)).toBe(await dessin(48213));
  });

  it('donne un dessin différent pour un autre billet', async () => {
    expect(await dessin(48213)).not.toBe(await dessin(73278));
  });

  it('dessine les 3 grands carrés de repérage dans les coins', async () => {
    const d = await dessin(1);
    // coin haut gauche (0,0), haut droit (20,0), bas gauche (0,20) : cases noires du contour
    expect(d).toContain('M0 0h1');
    expect(d).toContain('M20 0h1');
    expect(d).toContain('M0 20h1');
  });
});
