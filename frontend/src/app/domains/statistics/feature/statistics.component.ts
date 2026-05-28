import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { StatisticsModel } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight text-foreground mb-8">Statistici</h1>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-2xl ring-1 ring-foreground/10 shadow-xs p-5 mb-6">
        <div class="flex flex-wrap items-end gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium leading-none text-foreground">Anul</label>
            <select
              class="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="selectedYear()"
              (ngModelChange)="selectedYear.set($event)"
            >
              @for (y of availableYears; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium leading-none text-foreground">Luna</label>
            <select
              class="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="selectedMonth()"
              (ngModelChange)="selectedMonth.set(+$event)"
            >
              <option [value]="0">Toate lunile</option>
              @for (m of months; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <button
            class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50"
            (click)="loadStatistics()"
            [disabled]="loading()"
          >
            Aplică
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">Se încarcă...</div>
      }

      @if (stats(); as s) {
        <!-- Statistica voucherelor -->
        <div class="bg-card text-card-foreground rounded-2xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <h2 class="text-lg font-bold text-foreground mb-4">Statistica voucherelor</h2>
          <div class="divide-y divide-foreground/5">
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Total vouchere</span>
              <span class="text-sm font-bold text-foreground">{{ s.totalVouchers | number }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Vouchere Emise</span>
              <span class="text-sm font-bold text-foreground">{{ s.vouchersByStatus['Emis'] ?? 0 | number }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Vouchere Active</span>
              <span class="text-sm font-bold text-foreground">{{ s.vouchersByStatus['Activ'] ?? 0 | number }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Vouchere Executate</span>
              <span class="text-sm font-bold text-foreground">{{ s.vouchersByStatus['Executat'] ?? 0 | number }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Vouchere Raportate</span>
              <span class="text-sm font-bold text-foreground">{{ s.vouchersByStatus['Raportat'] ?? 0 | number }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Vouchere Anulate</span>
              <span class="text-sm font-bold text-foreground">{{ s.vouchersByStatus['Anulat'] ?? 0 | number }}</span>
            </div>
          </div>
        </div>

        <!-- Statistica lucrătorilor -->
        <div class="bg-card text-card-foreground rounded-2xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <h2 class="text-lg font-bold text-foreground mb-4">Statistica lucrătorilor</h2>
          <div class="divide-y divide-foreground/5">
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Total lucrători</span>
              <span class="text-sm font-bold text-foreground">{{ s.totalWorkers | number }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Ore lucrate totale</span>
              <span class="text-sm font-bold text-foreground">{{ s.totalHoursWorked | number }}</span>
            </div>
          </div>
        </div>

        <!-- Statistica remunerărilor -->
        <div class="bg-card text-card-foreground rounded-2xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <h2 class="text-lg font-bold text-foreground mb-4">Statistica remunerărilor</h2>
          <div class="divide-y divide-foreground/5">
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Remunerare netă totală</span>
              <span class="text-sm font-bold text-foreground">{{ s.totalNetRemuneration | number:'1.2-2' }} MDL</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Remunerare brută totală</span>
              <span class="text-sm font-bold text-foreground">{{ s.totalGrossRemuneration | number:'1.2-2' }} MDL</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-muted-foreground">Taxe colectate</span>
              <span class="text-sm font-bold text-foreground">{{ s.totalTaxCollected | number:'1.2-2' }} MDL</span>
            </div>
          </div>
        </div>

        <!-- Evoluție lunară (ascuns când e filtrat pe lună specifică) -->
        @if (monthlyRows().length > 0 && selectedMonth() === 0) {
          <div class="bg-card text-card-foreground rounded-2xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-input">
              <h2 class="text-lg font-bold text-foreground">Evoluție lunară</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-foreground/10">
                    <th class="h-10 px-4 text-start align-middle font-semibold text-foreground whitespace-nowrap">Lună</th>
                    <th class="h-10 px-4 text-end align-middle font-semibold text-foreground whitespace-nowrap">Vouchere</th>
                    <th class="h-10 px-4 text-end align-middle font-semibold text-foreground whitespace-nowrap">Ore</th>
                    <th class="h-10 px-4 text-end align-middle font-semibold text-foreground whitespace-nowrap">Remunerare (MDL)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of monthlyRows(); track row.month) {
                    <tr class="border-b border-foreground/5 hover:bg-muted/40 transition-colors">
                      <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80 font-medium">{{ row.month }}</td>
                      <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80 text-right">{{ row.vouchers | number }}</td>
                      <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80 text-right">{{ row.hours | number }}</td>
                      <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80 text-right">{{ row.remuneration | number:'1.2-2' }}</td>
                    </tr>
                  }
                  <tr class="border-t-2 border-foreground/20 bg-muted/30">
                    <td class="px-4 py-3 align-middle font-bold text-foreground">Total</td>
                    <td class="px-4 py-3 align-middle font-bold text-foreground text-right">{{ s.totalVouchers | number }}</td>
                    <td class="px-4 py-3 align-middle font-bold text-foreground text-right">{{ s.totalHoursWorked | number }}</td>
                    <td class="px-4 py-3 align-middle font-bold text-foreground text-right">{{ s.totalNetRemuneration | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class StatisticsComponent implements OnInit {
  private readonly api = inject(ApiService);

  private readonly currentYear = new Date().getFullYear();

  readonly availableYears: number[] = [
    this.currentYear - 2,
    this.currentYear - 1,
    this.currentYear,
  ];

  readonly months = [
    { value: 1, label: 'Ianuarie' }, { value: 2, label: 'Februarie' },
    { value: 3, label: 'Martie' }, { value: 4, label: 'Aprilie' },
    { value: 5, label: 'Mai' }, { value: 6, label: 'Iunie' },
    { value: 7, label: 'Iulie' }, { value: 8, label: 'August' },
    { value: 9, label: 'Septembrie' }, { value: 10, label: 'Octombrie' },
    { value: 11, label: 'Noiembrie' }, { value: 12, label: 'Decembrie' },
  ];

  protected readonly selectedYear = signal<number>(this.currentYear);
  protected readonly selectedMonth = signal<number>(0);
  protected readonly loading = signal(false);
  protected readonly stats = signal<StatisticsModel | null>(null);

  protected readonly monthlyRows = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.keys(s.vouchersByMonth)
      .sort()
      .reverse()
      .map(month => ({
        month,
        vouchers: s.vouchersByMonth[month] ?? 0,
        hours: s.hoursByMonth[month] ?? 0,
        remuneration: s.remunerationByMonth[month] ?? 0,
      }));
  });

  ngOnInit(): void {
    this.loadStatistics();
  }

  protected loadStatistics(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    const year = this.selectedYear();
    const month = this.selectedMonth();

    if (month > 0) {
      params['period'] = `${year}-${String(month).padStart(2, '0')}`;
    } else {
      params['dateFrom'] = `${year}-01-01`;
      params['dateTo'] = `${year}-12-31`;
    }

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
}
