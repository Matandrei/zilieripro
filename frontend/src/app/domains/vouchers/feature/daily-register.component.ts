import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { AuthStore } from '../../../shared/auth/auth.store';
import { VoucherDetail, VoucherTableItem } from '../../../shared/models/voucher.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-daily-register',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-[1400px] mx-auto">
      <!-- No-print header -->
      <div class="mb-4 flex items-center justify-between print:hidden">
        <div>
          <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Inapoi la vouchere</a>
          <h1 class="text-3xl font-bold tracking-tight text-foreground mt-2">Registrul zilnic al zilierilor</h1>
          <p class="text-sm text-muted-foreground mt-1">Data activitatii: <strong class="text-foreground">{{ formatRoDate(date()) }}</strong></p>
        </div>
        <div class="flex items-center gap-2">
          <input type="date" [value]="date()" (change)="onDateChange($any($event.target).value)"
            class="flex h-9 rounded-md border border-input bg-white px-3 py-1 text-sm" />
          <button type="button" (click)="print()"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Tipareste
          </button>
        </div>
      </div>

      <!-- Printable document -->
      <div class="bg-white rounded-xl ring-1 ring-foreground/10 shadow-sm p-6 print:p-0 print:shadow-none print:ring-0">
        <!-- Register header: Beneficiar -->
        <div class="mb-4 pb-4 border-b border-foreground/10">
          <h2 class="text-center text-base font-bold uppercase mb-2">Registru de evidenta a zilierilor</h2>
          <div class="text-sm space-y-1">
            <div><strong>Beneficiar:</strong> {{ beneficiary().name || '—' }}</div>
            <div><strong>Cod fiscal (IDNO):</strong> {{ beneficiary().idno || '—' }}</div>
            <div><strong>Adresa:</strong> {{ beneficiary().address || '—' }}</div>
            <div><strong>Data activitatii:</strong> {{ formatRoDate(date()) }}</div>
          </div>
        </div>

        @if (loading()) {
          <div class="p-8 text-center text-sm text-muted-foreground">Se incarca...</div>
        } @else if (rows().length === 0) {
          <div class="p-8 text-center text-sm text-muted-foreground">Nu sunt vouchere pentru data selectata.</div>
        } @else {
          <!-- 14-column register table -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-muted/40">
                  <th class="border border-foreground/20 px-2 py-2 font-semibold w-10">Nr. d/o</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Data desfasurarii activitatii</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Ora inceperii</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Ora finalizarii</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Numele si prenumele zilierului</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">IDNP, domiciliu</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Semnatura la inceperea activitatii</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Semnatura privind instruirea</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Locul exercitarii activitatii</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Denumirea activitatii desfasurate</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Remuneratia negociata (cifre si litere), lei</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Remuneratia achitata (cifre si litere), lei</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Semnatura de confirmare a primirii banilor</th>
                  <th class="border border-foreground/20 px-2 py-2 font-semibold">Stampila si semnatura beneficiarului</th>
                </tr>
                <tr class="bg-muted/20">
                  @for (c of colNums; track c) {
                    <th class="border border-foreground/20 px-2 py-1 text-muted-foreground font-normal">{{ c }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id; let i = $index) {
                  <tr class="align-top">
                    <td class="border border-foreground/20 px-2 py-3 text-center">{{ i + 1 }}</td>
                    <td class="border border-foreground/20 px-2 py-3 text-center whitespace-nowrap">{{ formatRoDate(row.workDate) }}</td>
                    <td class="border border-foreground/20 px-2 py-3 text-center">{{ startHour() }}</td>
                    <td class="border border-foreground/20 px-2 py-3 text-center">{{ endHour(row.hoursWorked) }}</td>
                    <td class="border border-foreground/20 px-2 py-3 whitespace-nowrap">{{ row.workerFullName }}</td>
                    <td class="border border-foreground/20 px-2 py-3">
                      <div class="font-mono">{{ row.workerIdnp }}</div>
                      <div class="text-muted-foreground text-[10px]">{{ row.workDistrict }}</div>
                    </td>
                    <td class="border border-foreground/20 px-2 py-3 min-w-[80px]"></td>
                    <td class="border border-foreground/20 px-2 py-3 min-w-[80px]"></td>
                    <td class="border border-foreground/20 px-2 py-3">{{ row.workDistrict }}</td>
                    <td class="border border-foreground/20 px-2 py-3">Zilier agricultura</td>
                    <td class="border border-foreground/20 px-2 py-3 text-right whitespace-nowrap">{{ row.netRemuneration }} lei<br/><span class="text-[10px] text-muted-foreground">({{ numberToWords(row.netRemuneration) }})</span></td>
                    <td class="border border-foreground/20 px-2 py-3 text-right whitespace-nowrap">{{ row.netRemuneration }} lei<br/><span class="text-[10px] text-muted-foreground">({{ numberToWords(row.netRemuneration) }})</span></td>
                    <td class="border border-foreground/20 px-2 py-3 min-w-[80px]"></td>
                    <td class="border border-foreground/20 px-2 py-3 min-w-[80px]"></td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="bg-muted/20 font-semibold">
                  <td colspan="10" class="border border-foreground/20 px-2 py-2 text-right">Total:</td>
                  <td class="border border-foreground/20 px-2 py-2 text-right">{{ totalAmount() }} lei</td>
                  <td class="border border-foreground/20 px-2 py-2 text-right">{{ totalAmount() }} lei</td>
                  <td colspan="2" class="border border-foreground/20"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="mt-6 flex justify-between items-end text-sm">
            <div>
              <div class="text-muted-foreground mb-8">Semnatura beneficiarului:</div>
              <div class="border-t border-foreground/30 w-64"></div>
            </div>
            <div class="text-right">
              <div class="text-muted-foreground mb-2">L.S. (locul pentru stampila)</div>
              <div class="w-24 h-24 border-2 border-dashed border-foreground/30 rounded-full inline-block"></div>
            </div>
          </div>
        }
      </div>
    </div>

    <style>
      @media print {
        @page { size: A4 landscape; margin: 12mm; }
        body { background: white !important; }
      }
    </style>
  `,
  styles: [`
    :host { display: block; }
    @media print {
      :host { background: white; }
    }
  `],
})
export class DailyRegisterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly voucherService = inject(VoucherDataService);
  private readonly authStore = inject(AuthStore);

  protected readonly date = signal(new Date().toISOString().split('T')[0]);
  protected readonly loading = signal(false);
  protected readonly rows = signal<VoucherTableItem[]>([]);

  protected readonly colNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  protected readonly beneficiary = computed(() => {
    const u = this.authStore.user();
    return {
      name: u?.beneficiaryName ?? '',
      idno: '',
      address: '',
    };
  });

  protected readonly totalAmount = computed(() =>
    Math.round(this.rows().reduce((sum, r) => sum + Number(r.netRemuneration), 0) * 100) / 100
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const d = q.get('date');
      if (d) this.date.set(d);
      this.loadData();
    });
  }

  protected onDateChange(d: string): void {
    this.date.set(d);
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.voucherService.getVouchers({
      offset: 0,
      limit: 200,
      dateFrom: this.date(),
      dateTo: this.date(),
    }).subscribe({
      next: (r) => {
        this.rows.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected print(): void {
    window.print();
  }

  protected formatRoDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  protected startHour(): string {
    return '08:00';
  }

  protected endHour(hours: number): string {
    const end = 8 + (hours || 8);
    return `${String(end).padStart(2, '0')}:00`;
  }

  protected numberToWords(n: number): string {
    // Simplified: just show the number in Romanian with "lei"
    // A full implementation would convert 250 -> "douasutecinzecilei"
    const rounded = Math.round(n);
    const map: Record<string, string> = {
      '100': 'una suta', '150': 'una suta cincizeci', '200': 'doua sute',
      '250': 'doua sute cincizeci', '300': 'trei sute', '350': 'trei sute cincizeci',
      '400': 'patru sute', '450': 'patru sute cincizeci', '500': 'cinci sute',
    };
    return map[String(rounded)] || `${rounded}`;
  }
}
