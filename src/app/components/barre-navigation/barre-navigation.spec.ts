import { TestBed } from '@angular/core/testing';
import { Event, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { BarreNavigation } from './barre-navigation';

// Barre dorée en haut de l'écran pendant le passage d'une page à l'autre
describe('components/BarreNavigation', () => {
  let evenements: Subject<Event>;
  let fixture: ReturnType<typeof TestBed.createComponent<BarreNavigation>>;
  const barre = () => (fixture.nativeElement as HTMLElement).querySelector('.barre')!;

  beforeEach(() => {
    vi.useFakeTimers();
    evenements = new Subject<Event>();
    TestBed.configureTestingModule({
      imports: [BarreNavigation],
      providers: [{ provide: Router, useValue: { events: evenements } }],
    });
    fixture = TestBed.createComponent(BarreNavigation);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  const naviguer = () => evenements.next(new NavigationStart(1, '/actualites/2'));
  const arriver = () => evenements.next(new NavigationEnd(1, '/actualites/2', '/actualites/2'));

  it('ne s’affiche pas pour un changement de page instantané (pas de clignotement)', () => {
    naviguer();
    vi.advanceTimersByTime(50);
    arriver();
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(barre().classList).not.toContain('barre--active');
  });

  it('s’affiche quand la page met du temps à arriver, puis se termine', () => {
    naviguer();
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(barre().classList).toContain('barre--active');

    arriver();
    fixture.detectChanges();
    expect(barre().classList).toContain('barre--finie');

    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(barre().classList).not.toContain('barre--active');
  });
});
