import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { AuthStore } from '../../../shared/auth/auth.store';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';

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
  periodStart: string;
  periodEnd: string;
  beneficiaryName: string;
  totalVouchers: number;
  executatCount: number;
  raportatCount: number;
  lines: Ipc21Line[];
  totals: {
    totalNet: number;
    totalGross: number;
    totalTax: number;
    totalCnas: number;
  };
}

interface PeriodOption {
  value: string;
  label: string;
}

const RO_MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

@Component({
  selector: 'app-ipc21-report',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, TranslatePipe, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-2">
        <a
          routerLink="/reports"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {{ 'reports.ipc21.back' | t }}
        </a>
      </div>
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">{{ 'reports.ipc21.title' | t }}</h1>
        </div>
        @if (!isInspector()) {
          <div class="w-full md:ml-auto md:w-auto">
            <button
              type="button"
              class="inline-flex h-9 w-full justify-center md:w-auto md:justify-start shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              [disabled]="!report() || downloading()"
              (click)="onExportClick()"
            >
              @if (downloading()) {
                <svg class="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v4m0 8v4m8-8h-4M8 12H4m13.657-5.657l-2.828 2.828M9.172 14.828l-2.829 2.829m0-11.314l2.829 2.829m5.656 5.656l2.828 2.828" />
                </svg>
                Se genereaza...
              } @else {
                Descarca PDF
              }
            </button>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">{{ 'reports.ipc21.period' | t }}</label>
            <select
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="selectedPeriod()"
              (ngModelChange)="selectedPeriod.set($event)"
            >
              @for (p of periodOptions; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
          </div>
          <div>
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50"
              [disabled]="loading()"
              (click)="loadReport()"
            >
              {{ 'reports.ipc21.generate' | t }}
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">{{ 'reports.ipc21.loading' | t }}</div>
      }

      @if (error(); as err) {
        <div class="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 text-sm text-destructive">{{ err }}</div>
      }

      @if (report(); as r) {
        <!-- Report Header Info -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-4">
          <div class="flex items-center gap-6 text-sm text-foreground/80">
            <span><strong class="text-foreground">{{ 'reports.ipc21.period' | t }}:</strong> {{ r.period }}</span>
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

        <!-- Counter panel -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-4 mt-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div class="text-muted-foreground">Voucher-e in raport</div>
              <div class="text-2xl font-semibold">{{ r.totalVouchers }}</div>
            </div>
            <div>
              <div class="text-muted-foreground">Executate (vor fi raportate)</div>
              <div class="text-2xl font-semibold text-warning">{{ r.executatCount }}</div>
            </div>
            <div>
              <div class="text-muted-foreground">Raportate anterior</div>
              <div class="text-2xl font-semibold text-muted-foreground">{{ r.raportatCount }}</div>
            </div>
          </div>
          @if (r.executatCount > 0) {
            <div class="mt-4 p-3 rounded-md bg-warning/10 border border-warning/30 text-sm text-warning-foreground">
              <strong>La descarcarea PDF, {{ r.executatCount }} voucher-e vor trece in status Raportat.</strong>
              Aceasta actiune este ireversibila.
            </div>
          }
        </div>
      }

      @if (showConfirm() && report(); as r) {
        <app-confirm-dialog
          [title]="'Confirmare raportare'"
          [message]="'Confirmati raportarea pentru ' + selectedPeriodLabel() + '? ' + r.executatCount + ' voucher-e vor trece in status Raportat.'"
          [confirmText]="'Descarca si raporteaza'"
          [confirmVariant]="'destructive'"
          [submitting]="downloading()"
          (confirmed)="onConfirmDownload()"
          (cancelled)="showConfirm.set(false)" />
      }

      @if (toastMessage(); as msg) {
        <div class="fixed bottom-6 right-6 z-[300] rounded-md bg-foreground text-background px-4 py-2 text-sm shadow-lg">
          {{ msg }}
        </div>
      }
    </div>
  `,
})
export class Ipc21ReportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  protected readonly isInspector = computed(() => this.authStore.roleType() === 'Inspector');

  protected readonly periodOptions: PeriodOption[] = this.buildPeriodOptions();
  protected readonly selectedPeriod = signal<string>(this.defaultPeriod());

  protected readonly beneficiaryId = signal('');
  protected readonly loading = signal(false);
  protected readonly downloading = signal(false);
  protected readonly error = signal('');
  protected readonly report = signal<Ipc21Report | null>(null);
  protected readonly showConfirm = signal(false);
  protected readonly toastMessage = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly selectedPeriodLabel = computed(() => {
    const p = this.selectedPeriod();
    return this.periodOptions.find((o) => o.value === p)?.label ?? p;
  });

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
      period: this.selectedPeriod(),
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

  protected onExportClick(): void {
    const r = this.report();
    if (!r) return;
    if (r.executatCount > 0) {
      this.showConfirm.set(true);
    } else {
      this.downloadPdf();
    }
  }

  protected onConfirmDownload(): void {
    this.downloadPdf();
  }

  private downloadPdf(): void {
    const period = this.selectedPeriod();
    this.downloading.set(true);
    this.api.exportIpc21Pdf(period, this.beneficiaryId() || undefined).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.downloading.set(false);
          this.showConfirm.set(false);
          this.flashToast('Raspuns gol de la server.');
          return;
        }

        const filename = this.parseFilename(response.headers.get('Content-Disposition'))
          ?? `IPC21-${period}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const transitioned = this.report()?.executatCount ?? 0;
        this.downloading.set(false);
        this.showConfirm.set(false);
        this.flashToast(transitioned > 0
          ? `Raport descarcat. ${transitioned} voucher-e marcate ca Raportat.`
          : 'Raport descarcat.');
        this.loadReport();
      },
      error: async (err) => {
        this.downloading.set(false);
        this.showConfirm.set(false);
        const msg = await this.extractBlobError(err);
        this.flashToast(msg ?? 'Eroare la descarcarea raportului.');
      },
    });
  }

  private parseFilename(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }

  private async extractBlobError(err: { error?: unknown; status?: number }): Promise<string | null> {
    try {
      if (err.error instanceof Blob) {
        const text = await err.error.text();
        try {
          const json = JSON.parse(text);
          const errors = (json as { errors?: Array<{ errorMessage?: string }> }).errors;
          if (Array.isArray(errors) && errors[0]?.errorMessage) return errors[0].errorMessage;
          if ((json as { message?: string }).message) return (json as { message: string }).message;
        } catch {
          if (text) return text;
        }
      }
    } catch {
      // Ignore parsing failures.
    }
    if (err.status === 403) return 'Nu aveti permisiuni pentru aceasta actiune.';
    if (err.status === 400) return 'Cerere invalida.';
    return null;
  }

  private flashToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.toastTimer = null;
    }, 3500);
  }

  private buildPeriodOptions(): PeriodOption[] {
    const out: PeriodOption[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIdx = d.getMonth();
      const yyyy = d.getFullYear();
      const mm = String(monthIdx + 1).padStart(2, '0');
      const monthName = RO_MONTHS[monthIdx];
      const label = monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + yyyy;
      out.push({ value: `${yyyy}-${mm}`, label });
    }
    return out;
  }

  private defaultPeriod(): string {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }
}
