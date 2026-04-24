import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoucherDataService } from '../../vouchers/data/voucher-data.service';
import { VoucherTableItem } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-inspector-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ 'inspector.title' | t }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ 'inspector.subtitle' | t }}</p>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">{{ 'common.loading' | t }}</div>
      } @else {
        <!-- Key metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
            <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'inspector.totalVouchers' | t }}</div>
            <div class="mt-1 text-2xl font-bold">{{ vouchers().length }}</div>
          </div>
          <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
            <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'inspector.beneficiaries' | t }}</div>
            <div class="mt-1 text-2xl font-bold">{{ uniqueBeneficiaries() }}</div>
          </div>
          <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
            <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'inspector.workers' | t }}</div>
            <div class="mt-1 text-2xl font-bold">{{ uniqueWorkers() }}</div>
          </div>
          <div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
            <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ 'inspector.totalSum' | t }}</div>
            <div class="mt-1 text-2xl font-bold text-primary">{{ totalNet() }} {{ 'common.mdl' | t }}</div>
          </div>
        </div>

        <!-- Per status -->
        <div class="bg-card rounded-xl ring-1 ring-foreground/10 p-5 mb-6">
          <h2 class="text-sm font-semibold mb-3">{{ 'inspector.byStatus' | t }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            @for (s of statusStats(); track s.status) {
              <div class="rounded-md ring-1 ring-foreground/10 p-3">
                <div class="flex items-center gap-2 text-xs">
                  <span [class]="'inline-block size-2 rounded-full ' + statusDot(s.status)"></span>
                  <span class="text-muted-foreground">{{ s.status }}</span>
                </div>
                <div class="mt-1 text-xl font-bold">{{ s.count }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Per district -->
        <div class="bg-card rounded-xl ring-1 ring-foreground/10 p-5 mb-6">
          <h2 class="text-sm font-semibold mb-3">{{ 'inspector.byRegion' | t }}</h2>
          <div class="space-y-2">
            @for (r of districtStats(); track r.district) {
              <div class="flex items-center gap-3">
                <div class="w-32 text-sm text-muted-foreground">{{ r.district }}</div>
                <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div class="h-full bg-primary" [style.width.%]="r.pct"></div>
                </div>
                <div class="w-16 text-right text-sm font-semibold">{{ r.count }}</div>
                <div class="w-24 text-right text-xs text-muted-foreground">{{ r.totalNet }} {{ 'common.mdl' | t }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Quick links -->
        <div class="bg-card rounded-xl ring-1 ring-foreground/10 p-5">
          <h2 class="text-sm font-semibold mb-3">{{ 'inspector.quickActions' | t }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a routerLink="/vouchers"
              class="flex items-center gap-3 rounded-md ring-1 ring-foreground/10 p-4 hover:bg-accent transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <div>
                <div class="font-semibold">{{ 'inspector.checkVouchers' | t }}</div>
                <div class="text-xs text-muted-foreground">{{ 'inspector.checkVouchersHint' | t }}</div>
              </div>
            </a>
            <a routerLink="/workers"
              class="flex items-center gap-3 rounded-md ring-1 ring-foreground/10 p-4 hover:bg-accent transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <div>
                <div class="font-semibold">{{ 'inspector.checkWorkers' | t }}</div>
                <div class="text-xs text-muted-foreground">{{ 'inspector.checkWorkersHint' | t }}</div>
              </div>
            </a>
            <a routerLink="/reports"
              class="flex items-center gap-3 rounded-md ring-1 ring-foreground/10 p-4 hover:bg-accent transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 6-6"/></svg>
              <div>
                <div class="font-semibold">{{ 'inspector.statsReports' | t }}</div>
                <div class="text-xs text-muted-foreground">{{ 'inspector.statsReportsHint' | t }}</div>
              </div>
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class InspectorDashboardComponent implements OnInit {
  private readonly voucherService = inject(VoucherDataService);

  protected readonly loading = signal(true);
  protected readonly vouchers = signal<VoucherTableItem[]>([]);

  protected readonly uniqueBeneficiaries = computed(() =>
    new Set(this.vouchers().map((v) => v.beneficiaryName).filter(Boolean)).size
  );

  protected readonly uniqueWorkers = computed(() =>
    new Set(this.vouchers().map((v) => v.workerIdnp).filter(Boolean)).size
  );

  protected readonly totalNet = computed(() =>
    Math.round(this.vouchers().reduce((s, v) => s + Number(v.netRemuneration), 0) * 100) / 100
  );

  protected readonly statusStats = computed(() => {
    const counts: Record<string, number> = {};
    for (const v of this.vouchers()) {
      counts[v.status] = (counts[v.status] ?? 0) + 1;
    }
    return ['Emis', 'Activ', 'Executat', 'Raportat', 'Anulat'].map((s) => ({
      status: s,
      count: counts[s] ?? 0,
    }));
  });

  protected readonly districtStats = computed(() => {
    const counts: Record<string, { count: number; totalNet: number }> = {};
    for (const v of this.vouchers()) {
      const d = v.workDistrict || '—';
      counts[d] = counts[d] ?? { count: 0, totalNet: 0 };
      counts[d].count += 1;
      counts[d].totalNet += Number(v.netRemuneration);
    }
    const max = Math.max(1, ...Object.values(counts).map((c) => c.count));
    return Object.entries(counts)
      .map(([district, c]) => ({ district, count: c.count, totalNet: Math.round(c.totalNet * 100) / 100, pct: (c.count / max) * 100 }))
      .sort((a, b) => b.count - a.count);
  });

  ngOnInit(): void {
    this.voucherService.getVouchers({ offset: 0, limit: 500 }).subscribe({
      next: (r) => {
        this.vouchers.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected statusDot(status: string): string {
    switch (status) {
      case 'Emis': return 'bg-gray-400';
      case 'Activ': return 'bg-blue-500';
      case 'Executat': return 'bg-green-500';
      case 'Raportat': return 'bg-emerald-500';
      case 'Anulat': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }
}
