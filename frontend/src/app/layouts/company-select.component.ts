import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../shared/auth/auth.store';
import { RsudService, RsudCompany } from '../shared/services/rsud.service';

@Component({
  selector: 'app-company-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white flex items-center justify-center p-4">
      <div class="w-full max-w-3xl bg-card text-card-foreground ring-1 ring-foreground/10 rounded-xl shadow-xs overflow-hidden">

        <!-- Header -->
        <div class="px-6 py-5 bg-muted/30 border-b border-foreground/10">
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Selectare companie</h1>
          @if (auth.user(); as u) {
            <p class="text-sm text-muted-foreground mt-1">
              Autentificat ca: <strong class="text-foreground">{{ u.lastName }} {{ u.firstName }}</strong>
              <span class="text-muted-foreground"> (IDNP: <span class="font-mono">{{ u.idnp }}</span>)</span>
            </p>
          }
        </div>

        <div class="p-6">
          <!-- Source badge -->
          <div class="inline-flex items-center gap-2 mb-4 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs text-primary font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
            Companiile dvs. din RSUD (prin MConnect)
          </div>

          @if (loading()) {
            <div class="text-center py-12 text-muted-foreground">Se incarca companiile...</div>
          } @else if (companies().length === 0) {
            <div class="text-center py-12">
              <p class="text-muted-foreground mb-4">Nicio companie nu a fost gasita pentru IDNP-ul dvs. in RSUD.</p>
              <button type="button" (click)="logout()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                Inapoi la login
              </button>
            </div>
          } @else {
            <p class="text-sm text-muted-foreground mb-4">
              Selectati compania pentru care doriti sa accesati eZilier:
            </p>

            <div class="space-y-2 mb-6">
              @for (c of companies(); track c.idno) {
                <label
                  [class]="'block rounded-lg ring-1 px-4 py-3 transition-colors ' +
                    (c.status === 'Radiat'
                      ? 'ring-foreground/10 bg-muted/40 cursor-not-allowed opacity-60'
                      : (selectedIdno() === c.idno
                          ? 'ring-2 ring-primary bg-primary/5 cursor-pointer'
                          : 'ring-foreground/10 hover:bg-accent/40 cursor-pointer'))">
                  <div class="flex items-start gap-3">
                    <input type="radio" name="company"
                      [value]="c.idno"
                      [checked]="selectedIdno() === c.idno"
                      [disabled]="c.status === 'Radiat'"
                      (change)="selectedIdno.set(c.idno)"
                      class="mt-1 size-4 accent-primary" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-foreground">{{ c.companyName }}</span>
                        <span [class]="'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ' +
                          (c.status === 'Radiat' ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success')">
                          {{ c.status }}
                        </span>
                      </div>
                      <div class="mt-0.5 text-xs text-muted-foreground">
                        IDNO: <span class="font-mono text-foreground">{{ c.idno }}</span>
                        · Rol: <strong class="text-foreground">{{ c.role }}</strong>
                      </div>
                      <div class="mt-0.5 text-xs text-muted-foreground">
                        {{ c.legalForm }} · {{ c.activityType }} · {{ c.address }}
                      </div>
                    </div>
                  </div>
                </label>
              }
            </div>

            <div class="flex items-center justify-between gap-3">
              <button type="button" (click)="logout()"
                class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                Inapoi la login
              </button>
              <button type="button" (click)="confirm()" [disabled]="!selectedIdno() || !canSelect()"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                Continua cu compania selectata
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CompanySelectComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly rsud = inject(RsudService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly selectedIdno = signal<string | null>(null);

  protected readonly companies = computed(() => this.rsud.companies());

  protected readonly canSelect = computed(() => {
    const id = this.selectedIdno();
    if (!id) return false;
    const c = this.companies().find((x) => x.idno === id);
    return !!c && c.status === 'Activ';
  });

  ngOnInit(): void {
    // Make sure no prior selection is set so the user has to pick fresh.
    this.rsud.select(null);
    this.loading.set(true);
    this.rsud.loadCompanies().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  protected confirm(): void {
    const id = this.selectedIdno();
    if (!id || !this.canSelect()) return;
    this.rsud.select(id);
    this.router.navigate(['/vouchers']);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
