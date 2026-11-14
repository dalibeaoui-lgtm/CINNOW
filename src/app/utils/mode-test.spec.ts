import { debutDuModeTest, estModeTest } from './mode-test';

// Mode test : « admin » accepté dans les champs du paiement et de la connexion
describe('utils/mode-test', () => {
  it('reconnaît « admin », sans tenir compte des majuscules et des espaces', () => {
    expect(estModeTest('admin')).toBe(true);
    expect(estModeTest('  ADMIN ')).toBe(true);
    expect(estModeTest('administrateur')).toBe(false);
    expect(estModeTest('')).toBe(false);
  });

  it('reconnaît le début de « admin » pendant la frappe', () => {
    expect(debutDuModeTest('a')).toBe(true);
    expect(debutDuModeTest('adm')).toBe(true);
    expect(debutDuModeTest('4970')).toBe(false);
    expect(debutDuModeTest('')).toBe(false);
  });
});
