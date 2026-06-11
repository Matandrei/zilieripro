import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { StatisticsModel } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { AuthStore } from '../../../shared/auth/auth.store';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">{{ 'reports.title' | t }}</h1>
        </div>
        @if (!isInspector()) {
          <div class="w-full md:ml-auto md:w-auto">
            <a
              routerLink="/reports/ipc21"
              class="inline-flex h-9 w-full justify-center md:w-auto md:justify-start shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
            >
              Raport IPC-21
            </a>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">IDNP Lucrător</label>
            <input
              type="text"
              placeholder="Filtrare parțială..."
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="workerIdnp()"
              (ngModelChange)="workerIdnp.set($event)"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Raion</label>
            <select
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="district()"
              (ngModelChange)="district.set($event)"
            >
              <option value="">Toate raioanele</option>
              <option value="Chisinau">Chisinau</option>
              <option value="Balti">Balti</option>
              <option value="Cahul">Cahul</option>
              <option value="Orhei">Orhei</option>
              <option value="Ungheni">Ungheni</option>
              <option value="Soroca">Soroca</option>
            </select>
          </div>
          <div class="flex gap-2 md:col-span-4">
            <button
              class="flex-1 inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
              (click)="loadStatistics()"
            >
              Filtrează
            </button>
            @if (!isInspector()) {
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-muted disabled:opacity-50"
                (click)="exportCsv()"
                [disabled]="exportingCsv()"
              >
                {{ exportingCsv() ? 'Se exportă...' : 'Export CSV' }}
              </button>
            }
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">Se incarca...</div>
      }

      @if (stats(); as s) {
        <!-- Inspector KPI Panel -->
        @if (isInspector()) {
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Tablou de bord Inspector ISM</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="rounded-lg bg-primary/5 ring-1 ring-primary/20 p-4 text-center">
                <div class="text-2xl font-bold text-primary">{{ raportatCount() | number }}</div>
                <div class="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Raportat</div>
              </div>
              <div class="rounded-lg bg-destructive/5 ring-1 ring-destructive/20 p-4 text-center">
                <div class="text-2xl font-bold text-destructive">{{ anulatCount() | number }}</div>
                <div class="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Anulat</div>
              </div>
              <div class="rounded-lg bg-muted/50 ring-1 ring-foreground/10 p-4 text-center">
                <div class="text-2xl font-bold text-foreground">{{ s.totalBeneficiaries | number }}</div>
                <div class="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Beneficiari activi</div>
              </div>
              <div class="rounded-lg bg-muted/50 ring-1 ring-foreground/10 p-4 text-center">
                <div class="text-2xl font-bold text-foreground">{{ anulatRatio() }}%</div>
                <div class="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Rată anulare</div>
              </div>
            </div>
            <!-- RAPORTAT vs ANULAT progress bar -->
            @if (raportatCount() + anulatCount() > 0) {
              <div>
                <div class="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Raportat ({{ raportatCount() }})</span>
                  <span>Anulat ({{ anulatCount() }})</span>
                </div>
                <div class="flex h-3 rounded-full overflow-hidden bg-destructive/20">
                  <div class="bg-primary transition-all" [style.width.%]="raportatPercent()"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Summary Section -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">Sumar</h2>
          </div>
          <dl class="divide-y divide-foreground/5">
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Total Vouchere</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalVouchers | number }}</dd>
            </div>
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Total Lucrători</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalWorkers | number }}</dd>
            </div>
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Total Beneficiari</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalBeneficiaries | number }}</dd>
            </div>
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Ore Lucrate Totale</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalHoursWorked | number }}</dd>
            </div>
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Remunerare Netă Totală</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalNetRemuneration | number:'1.2-2' }} MDL</dd>
            </div>
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Remunerare Brută Totală</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalGrossRemuneration | number:'1.2-2' }} MDL</dd>
            </div>
            <div class="flex items-center justify-between px-6 py-3">
              <dt class="text-sm text-muted-foreground">Taxe Colectate</dt>
              <dd class="text-sm font-semibold text-foreground">{{ s.totalTaxCollected | number:'1.2-2' }} MDL</dd>
            </div>
          </dl>
        </div>

        <!-- Vouchers by Status -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <h2 class="text-lg font-semibold text-foreground mb-4">Vouchere după Status</h2>
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
            <p class="text-sm text-muted-foreground">Nu există date.</p>
          }
        </div>

        <!-- Vouchers by District -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">Vouchere după Raion</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Raion</th>
                  <th class="text-foreground h-10 px-4 text-end align-middle font-medium whitespace-nowrap">Nr. Vouchere</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (entry of districtEntries(); track entry.key) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ entry.key }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80 text-right">{{ entry.value | number }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="px-4 py-6 align-middle text-center text-sm text-muted-foreground">Nu există date.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Remuneration by Month -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">Remunerare după Lună</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Lună</th>
                  <th class="text-foreground h-10 px-4 text-end align-middle font-medium whitespace-nowrap">Remunerare (MDL)</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (entry of monthEntries(); track entry.key) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ entry.key }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80 text-right">{{ entry.value | number:'1.2-2' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="px-4 py-6 align-middle text-center text-sm text-muted-foreground">Nu există date.</td>
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
  private readonly auth = inject(AuthStore);

  protected readonly isInspector = computed(() => this.auth.roleType() === 'Inspector');

  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly workerIdnp = signal('');
  protected readonly district = signal('');
  protected readonly loading = signal(false);
  protected readonly exportingCsv = signal(false);
  protected readonly stats = signal<StatisticsModel | null>(null);

  protected readonly raportatCount = computed(() => this.stats()?.vouchersByStatus?.['Raportat'] ?? 0);
  protected readonly anulatCount = computed(() => this.stats()?.vouchersByStatus?.['Anulat'] ?? 0);
  protected readonly anulatRatio = computed(() => {
    const total = this.stats()?.totalVouchers ?? 0;
    if (total === 0) return 0;
    return Math.round((this.anulatCount() / total) * 100);
  });
  protected readonly raportatPercent = computed(() => {
    const total = this.raportatCount() + this.anulatCount();
    if (total === 0) return 0;
    return Math.round((this.raportatCount() / total) * 100);
  });

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
    const params = this.buildParams();

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

  protected exportCsv(): void {
    this.exportingCsv.set(true);
    const params = this.buildParams();

    this.api.exportStatisticsCsv(params).subscribe({
      next: (response) => {
        const blob = response.body!;
        const cd = response.headers.get('content-disposition') ?? '';
        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        const fileName = match ? match[1].replace(/['"]/g, '') : 'statistici.csv';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingCsv.set(false);
      },
      error: () => {
        this.exportingCsv.set(false);
      },
    });
  }

  private buildParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.dateFrom()) params['dateFrom'] = this.dateFrom();
    if (this.dateTo()) params['dateTo'] = this.dateTo();
    if (this.workerIdnp()) params['workerIdnp'] = this.workerIdnp();
    if (this.district()) params['district'] = this.district();
    return params;
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
