import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { StatisticsModel } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">Rapoarte &amp; Statistici</h1>
        </div>
        <div class="w-full md:ml-auto md:w-auto">
          <a
            routerLink="/reports/ipc21"
            class="inline-flex h-9 w-full justify-center md:w-auto md:justify-start shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
          >
            Raport IPC-21
          </a>
        </div>
      </div>

      <!-- Period Filter -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Data de la</label>
            <input
              type="date"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="dateFrom()"
              (ngModelChange)="dateFrom.set($event)"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Data pana la</label>
            <input
              type="date"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="dateTo()"
              (ngModelChange)="dateTo.set($event)"
            />
          </div>
          <div>
            <button
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
              (click)="loadStatistics()"
            >
              Filtreaza
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">Se incarca...</div>
      }

      @if (stats(); as s) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <p class="text-sm text-muted-foreground">Total Vouchere</p>
            <p class="mt-1 text-2xl font-bold text-foreground">{{ s.totalVouchers | number }}</p>
          </div>
          <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <p class="text-sm text-muted-foreground">Total Lucratori</p>
            <p class="mt-1 text-2xl font-bold text-foreground">{{ s.totalWorkers | number }}</p>
          </div>
          <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <p class="text-sm text-muted-foreground">Total Beneficiari</p>
            <p class="mt-1 text-2xl font-bold text-foreground">{{ s.totalBeneficiaries | number }}</p>
          </div>
          <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <p class="text-sm text-muted-foreground">Remunerare Neta Totala</p>
            <p class="mt-1 text-2xl font-bold text-foreground">{{ s.totalNetRemuneration | number:'1.2-2' }} MDL</p>
          </div>
          <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <p class="text-sm text-muted-foreground">Remunerare Bruta Totala</p>
            <p class="mt-1 text-2xl font-bold text-foreground">{{ s.totalGrossRemuneration | number:'1.2-2' }} MDL</p>
          </div>
          <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <p class="text-sm text-muted-foreground">Taxe Colectate</p>
            <p class="mt-1 text-2xl font-bold text-foreground">{{ s.totalTaxCollected | number:'1.2-2' }} MDL</p>
          </div>
        </div>

        <!-- Vouchers by Status -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-8">
          <h2 class="text-lg font-semibold text-foreground mb-4">Vouchere dupa Status</h2>
          @for (entry of statusEntries(); track entry.key) {
            <div class="flex items-center gap-3 mb-3">
              <span class="w-24 text-sm text-foreground/80 font-medium">{{ entry.key }}</span>
              <div class="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div
                  class="h-6 rounded-full flex items-center justify-end pr-2 text-xs font-medium text-white"
                  [style.width.%]="statusPercent(entry.value)"
                  [class]="statusBarColor(entry.key)"
                >
                  {{ entry.value }}
                </div>
              </div>
            </div>
          } @empty {
            <p class="text-sm text-muted-foreground">Nu exista date.</p>
          }
        </div>

        <!-- Vouchers by District -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden mb-8">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">Vouchere dupa Raion</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Raion</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Nr. Vouchere</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (entry of districtEntries(); track entry.key) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ entry.key }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ entry.value | number }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="p-2 align-middle py-6 text-center text-sm text-muted-foreground">Nu exista date.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Remuneration by Month -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">Remunerare dupa Luna</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Luna</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Remunerare (MDL)</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (entry of monthEntries(); track entry.key) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ entry.key }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ entry.value | number:'1.2-2' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="p-2 align-middle py-6 text-center text-sm text-muted-foreground">Nu exista date.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly loading = signal(false);
  protected readonly stats = signal<StatisticsModel | null>(null);

  protected readonly statusEntries = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.vouchersByStatus).map(([key, value]) => ({ key, value }));
  });

  protected readonly districtEntries = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.vouchersByDistrict).map(([key, value]) => ({ key, value }));
  });

  protected readonly monthEntries = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.remunerationByMonth).map(([key, value]) => ({ key, value }));
  });

  ngOnInit(): void {
    this.loadStatistics();
  }

  protected loadStatistics(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.dateFrom()) params['dateFrom'] = this.dateFrom();
    if (this.dateTo()) params['dateTo'] = this.dateTo();

    this.api.getStatistics(params).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected statusPercent(value: number): number {
    const s = this.stats();
    if (!s || s.totalVouchers === 0) return 0;
    return Math.max(4, (value / s.totalVouchers) * 100);
  }

  protected statusBarColor(status: string): string {
    const colors: Record<string, string> = {
      'Emis': 'bg-muted-foreground',
      'Activ': 'bg-success',
      'Executat': 'bg-warning',
      'Raportat': 'bg-primary',
      'Anulat': 'bg-destructive',
    };
    return colors[status] ?? 'bg-muted-foreground';
  }
}
