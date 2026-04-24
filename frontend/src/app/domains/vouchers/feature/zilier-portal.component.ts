import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoucherDataService } from '../data/voucher-data.service';
import { AuthStore } from '../../../shared/auth/auth.store';
import { VoucherTableItem } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-zilier-portal',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Greeting -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ 'zilier.title' | t }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ 'zilier.greeting' | t }}, <strong class="text-foreground">{{ auth.fullName() }}</strong>. {{ 'zilier.subtitle' | t }}
        </p>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
          <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'zilier.totalVouchers' | t }}</div>
          <div class="mt-1 text-2xl font-bold">{{ vouchers().length }}</div>
        </div>
        <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
          <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'zilier.daysWorked' | t }}</div>
          <div class="mt-1 text-2xl font-bold">{{ executedCount() }}</div>
        </div>
        <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
          <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'zilier.totalReceived' | t }}</div>
          <div class="mt-1 text-2xl font-bold text-primary">{{ totalNet() }} {{ 'common.mdl' | t }}</div>
        </div>
        <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
          <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'zilier.hoursWorked' | t }}</div>
          <div class="mt-1 text-2xl font-bold">{{ totalHours() }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)"
          [placeholder]="'zilier.searchPlaceholder' | t"
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
        <input type="date" [ngModel]="dateFrom()" (ngModelChange)="dateFrom.set($event)"
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
        <input type="date" [ngModel]="dateTo()" (ngModelChange)="dateTo.set($event)"
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
      </div>

      <!-- List -->
      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">{{ 'common.loading' | t }}</div>
      } @else if (filtered().length === 0) {
        <div class="rounded-md border border-dashed border-foreground/20 p-12 text-center text-sm text-muted-foreground">
          {{ 'zilier.empty' | t }}
        </div>
      } @else {
        <div class="space-y-3">
          @for (v of filtered(); track v.id) {
            <div class="rounded-xl ring-1 ring-foreground/10 bg-card p-4 hover:shadow-sm transition-shadow">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono font-semibold text-primary">{{ v.code }}</span>
                    <span [class]="'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + statusPill(v.status)">
                      {{ v.status }}
                    </span>
                  </div>
                  <div class="mt-1 text-sm text-muted-foreground">
                    {{ 'zilier.employer' | t }}: <strong class="text-foreground">{{ v.beneficiaryName || '—' }}</strong>
                    · {{ formatDate(v.workDate) }}
                    · {{ v.hoursWorked }}h
                    · {{ v.workDistrict }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-right">
                    <div class="text-xs text-muted-foreground">{{ 'field.remuneration' | t }}</div>
                    <div class="font-bold text-lg text-primary">{{ v.netRemuneration }} {{ 'common.mdl' | t }}</div>
                  </div>
                  <a [routerLink]="['/my-vouchers', v.id, 'receipt']"
                    class="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
                    title="Print">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Print
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ZilierPortalComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly voucherService = inject(VoucherDataService);

  protected readonly loading = signal(true);
  protected readonly vouchers = signal<VoucherTableItem[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  protected readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const from = this.dateFrom();
    const to = this.dateTo();
    return this.vouchers().filter((v) => {
      if (term && !(
        v.code.toLowerCase().includes(term) ||
        v.workerFullName.toLowerCase().includes(term) ||
        v.workDistrict.toLowerCase().includes(term)
      )) return false;
      if (from && v.workDate < from) return false;
      if (to && v.workDate > to) return false;
      return true;
    });
  });

  protected readonly executedCount = computed(() =>
    this.vouchers().filter((v) => v.status === 'Executat' || v.status === 'Raportat').length
  );

  protected readonly totalNet = computed(() =>
    Math.round(
      this.vouchers()
        .filter((v) => v.status === 'Executat' || v.status === 'Raportat')
        .reduce((s, v) => s + Number(v.netRemuneration), 0) * 100
    ) / 100
  );

  protected readonly totalHours = computed(() =>
    this.vouchers()
      .filter((v) => v.status === 'Executat' || v.status === 'Raportat')
      .reduce((s, v) => s + v.hoursWorked, 0)
  );

  ngOnInit(): void {
    this.voucherService.getVouchers({ offset: 0, limit: 200 }).subscribe({
      next: (r) => {
        this.vouchers.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected statusPill(status: string): string {
    switch (status) {
      case 'Emis': return 'bg-gray-100 text-gray-700';
      case 'Activ': return 'bg-blue-100 text-blue-700';
      case 'Executat': return 'bg-green-100 text-green-700';
      case 'Raportat': return 'bg-emerald-100 text-emerald-700';
      case 'Anulat': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
}
