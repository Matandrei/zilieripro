import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { AuthStore } from '../../../shared/auth/auth.store';

export interface Ipc21Line {
  workerIdnp: string;
  workerFirstName: string;
  workerLastName: string;
  daysWorked: number;
  hoursWorked: number;
  netRemuneration: number;
  incomeTax: number;
  cnasContribution: number;
  grossRemuneration: number;
}

export interface Ipc21Report {
  period: string;
  beneficiaryName: string;
  lines: Ipc21Line[];
  totals: {
    totalNet: number;
    totalGross: number;
    totalTax: number;
    totalCnas: number;
  };
}

@Component({
  selector: 'app-ipc21-report',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-2">
        <a
          routerLink="/reports"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Inapoi la rapoarte
        </a>
      </div>
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">Raport IPC-21</h1>
        </div>
        <div class="w-full md:ml-auto md:w-auto">
          <button
            class="inline-flex h-9 w-full justify-center md:w-auto md:justify-start shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            [disabled]="!report()"
            (click)="exportReport()"
          >
            Exporta
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Perioada</label>
            <div class="flex gap-2">
              <select
                class="flex-1 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="selectedMonth()"
                (ngModelChange)="selectedMonth.set($event)"
              >
                @for (m of months; track m.value) {
                  <option [value]="m.value">{{ m.label }}</option>
                }
              </select>
              <select
                class="w-28 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="selectedYear()"
                (ngModelChange)="selectedYear.set($event)"
              >
                @for (y of years; track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
          </div>
          <div>
            <button
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
              (click)="loadReport()"
            >
              Genereaza
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">Se incarca raportul...</div>
      }

      @if (error(); as err) {
        <div class="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 text-sm text-destructive">{{ err }}</div>
      }

      @if (report(); as r) {
        <!-- Report Header Info -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-4">
          <div class="flex items-center gap-6 text-sm text-foreground/80">
            <span><strong class="text-foreground">Perioada:</strong> {{ r.period }}</span>
          </div>
        </div>

        <!-- Report Table -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Nr</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">IDNP Lucrator</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Nume</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Prenume</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Zile lucrate</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Ore lucrate</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Remunerare Neta</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Impozit Venit</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">CNAS</th>
                  <th class="text-foreground h-10 px-2 text-end align-middle font-medium whitespace-nowrap">Remunerare Bruta</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (line of r.lines; track line.workerIdnp; let i = $index) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ i + 1 }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 font-mono">{{ line.workerIdnp }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ line.workerLastName }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ line.workerFirstName }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ line.daysWorked }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ line.hoursWorked }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ line.netRemuneration | number:'1.2-2' }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ line.incomeTax | number:'1.2-2' }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ line.cnasContribution | number:'1.2-2' }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80 text-right">{{ line.grossRemuneration | number:'1.2-2' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="10" class="p-2 align-middle py-8 text-center text-sm text-muted-foreground">
                      Nu exista date pentru perioada selectata.
                    </td>
                  </tr>
                }
              </tbody>
              @if (r.lines.length > 0) {
                <tfoot class="border-t-2 border-foreground/20">
                  <tr class="font-semibold">
                    <td colspan="6" class="p-2 text-sm text-foreground text-right">TOTAL</td>
                    <td class="p-2 text-sm text-foreground text-right">{{ r.totals.totalNet | number:'1.2-2' }}</td>
                    <td class="p-2 text-sm text-foreground text-right">{{ r.totals.totalTax | number:'1.2-2' }}</td>
                    <td class="p-2 text-sm text-foreground text-right">{{ r.totals.totalCnas | number:'1.2-2' }}</td>
                    <td class="p-2 text-sm text-foreground text-right">{{ r.totals.totalGross | number:'1.2-2' }}</td>
                  </tr>
                </tfoot>
              }
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class Ipc21ReportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  protected readonly months = [
    { value: '01', label: 'Ianuarie' },
    { value: '02', label: 'Februarie' },
    { value: '03', label: 'Martie' },
    { value: '04', label: 'Aprilie' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Iunie' },
    { value: '07', label: 'Iulie' },
    { value: '08', label: 'August' },
    { value: '09', label: 'Septembrie' },
    { value: '10', label: 'Octombrie' },
    { value: '11', label: 'Noiembrie' },
    { value: '12', label: 'Decembrie' },
  ];

  protected readonly years = this.generateYears();

  protected readonly selectedMonth = signal(this.currentMonth());
  protected readonly selectedYear = signal(String(new Date().getFullYear()));
  protected readonly beneficiaryId = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly report = signal<Ipc21Report | null>(null);

  protected readonly period = computed(() => `${this.selectedYear()}-${this.selectedMonth()}`);

  ngOnInit(): void {
    const user = this.authStore.user();
    if (user?.beneficiaryId) {
      this.beneficiaryId.set(user.beneficiaryId);
    }
  }

  protected loadReport(): void {
    const bid = this.beneficiaryId();
    if (!bid) {
      this.error.set('Selectati un beneficiar.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.report.set(null);

    this.api.get<Ipc21Report>('/reports/ipc21', {
      beneficiaryId: bid,
      period: this.period(),
    }).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Eroare la generarea raportului. Incercati din nou.');
        this.loading.set(false);
      },
    });
  }

  protected exportReport(): void {
    // Placeholder for export functionality
    alert('Functionalitatea de export va fi disponibila in curand.');
  }

  private currentMonth(): string {
    return String(new Date().getMonth() + 1).padStart(2, '0');
  }

  private generateYears(): string[] {
    const current = new Date().getFullYear();
    const result: string[] = [];
    for (let y = current; y >= current - 5; y--) {
      result.push(String(y));
    }
    return result;
  }
}
