import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { VoucherDataService } from '../data/voucher-data.service';
import { ApiService } from '../../../shared/services/api.service';
import { NomenclatorModel, VoucherDetail, CancellationReasonCode } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-voucher-bulk-print',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Toolbar (hidden on print) -->
      <div class="mb-4 flex items-center justify-between print:hidden">
        <a routerLink="/vouchers"
           class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Inapoi la lista
        </a>
        @if (vouchers().length > 0) {
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted-foreground">{{ vouchers().length }} voucher(e) — {{ failed() > 0 ? failed() + ' eronate' : 'gata pentru tipar' }}</span>
            <button type="button" (click)="print()"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print toate
            </button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">Se incarca {{ requested() }} vouchere...</div>
      } @else if (vouchers().length === 0) {
        <div class="text-center py-12 text-destructive">Niciun voucher gasit.</div>
      } @else {
        @for (v of vouchers(); track v.id; let last = $last) {
          <article class="voucher-sheet text-black text-sm" [class.page-break]="!last">
            <h1 class="text-2xl font-bold mb-4">Voucher {{ v.code }}</h1>

            <section class="mb-4">
              <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                <dt>COD</dt><dd>{{ v.code }}</dd>
                <dt>EMIS</dt><dd>{{ formatDateTime(v.createdAt) }}</dd>
                <dt>STATUT</dt><dd>{{ v.status | uppercase }}</dd>
              </dl>
            </section>

            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase mb-2">Beneficiarul de lucrari (Angajator)</h2>
              <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                <dt>IDNO</dt><dd>{{ v.beneficiary.idno }}</dd>
                <dt>Denumirea companiei</dt><dd>{{ v.beneficiary.companyName }}</dd>
              </dl>
            </section>

            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase mb-2">Zilierul (Lucrator)</h2>
              <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                <dt>IDNP</dt><dd>{{ v.worker.idnp }}</dd>
                <dt>Numele</dt><dd>{{ v.worker.lastName }}</dd>
                <dt>Prenumele</dt><dd>{{ v.worker.firstName }}</dd>
              </dl>
            </section>

            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase mb-2">Detalii activitate</h2>
              <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                <dt>Ziua de activitate</dt><dd>{{ formatDate(v.workDate) }}</dd>
                <dt>Numarul de ore lucrate</dt><dd>{{ v.hoursWorked }}</dd>
                <dt>Locul exercitarii activitatii</dt>
                <dd>
                  {{ v.workLocality }}, {{ v.workDistrict }}
                  @if (v.workAddress) { <br/>{{ v.workAddress }} }
                </dd>
                <dt>Activitatea realizata</dt><dd>{{ activityLabel(v.activityType) }}</dd>
              </dl>
            </section>

            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase mb-2">Date financiare</h2>
              <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                <dt>Remuneratia neta (MDL)</dt><dd>{{ formatMoney(v.netRemuneration) }}</dd>
                <dt>Impozit pe venit 12% (MDL)</dt><dd>{{ formatMoney(v.incomeTax) }}</dd>
                <dt>Contributii CNAS 6% (MDL)</dt><dd>{{ formatMoney(v.cnasContribution) }}</dd>
                <dt>Remuneratia bruta (MDL)</dt><dd>{{ formatMoney(v.grossRemuneration) }}</dd>
              </dl>
            </section>

            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase mb-1">Confirmarea prestarii si primirii remuneratiei</h2>
              <p>
                Prin semnarea prezentului voucher, zilierul confirma prestarea activitatii
                si primirea remuneratiei in cuantumul indicat mai sus.
              </p>
            </section>

            @if (v.status === 'Anulat') {
              <section class="mb-4">
                <h2 class="text-sm font-bold uppercase mb-2">Voucher anulat</h2>
                <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                  <dt>Motiv</dt><dd>{{ cancelReasonLabel(v.cancellationReason!) }}</dd>
                  @if (v.cancellationNote) { <dt>Nota</dt><dd>{{ v.cancellationNote }}</dd> }
                  @if (v.cancellationDate) { <dt>Data anularii</dt><dd>{{ formatDateTime(v.cancellationDate) }}</dd> }
                </dl>
              </section>
            }

            <!-- Signatures (always visible — this is the bulk print page) -->
            <section class="mt-8 mb-4">
              <div class="grid grid-cols-2 gap-8">
                <div>
                  <div class="text-xs mb-8">Semnatura zilierului (olografa)</div>
                  <div class="h-12 border-b border-black"></div>
                </div>
                <div>
                  <div class="text-xs mb-2">Semnatura electronica a entitatii</div>
                  @if (v.signatureDataUrl) {
                    <div class="h-12 border-b border-black flex items-end justify-center">
                      <img [src]="v.signatureDataUrl" alt="Semnatura" class="max-h-full object-contain" />
                    </div>
                    <div class="text-[10px] mt-1">
                      @if (v.signedAt; as s) { {{ formatDateTime(s) }} }
                    </div>
                  } @else {
                    <div class="h-12 border-b border-black flex items-center justify-center">
                      <span class="text-[10px] italic">[Aplicata automat la imprimare]</span>
                    </div>
                  }
                </div>
              </div>
            </section>

            <div class="mt-6">
              Prezentul voucher constituie dovada remuneratiei zilierului — Art. 9 alin. (3), Legea nr. 22/2018.<br/>
              Document generat automat din sistemul informational eZilier.
            </div>
          </article>
        }
      }
    </div>

    <style>
      :host ::ng-deep .voucher-sheet { padding: 8mm 0; }
      /* Each voucher (except the last) starts a fresh page when printing. */
      :host ::ng-deep .voucher-sheet.page-break { page-break-after: always; }

      @media print {
        @page { size: A4 portrait; margin: 12mm; }
        :host ::ng-deep .voucher-sheet { padding: 0; font-size: 11pt; page-break-inside: avoid; }
        :host ::ng-deep .voucher-sheet h1 { font-size: 16pt; margin-bottom: 6mm; }
        :host ::ng-deep .voucher-sheet h2 { font-size: 11pt; margin-bottom: 2mm; }
        :host ::ng-deep .voucher-sheet section { margin-bottom: 4mm; page-break-inside: avoid; }
        :host ::ng-deep .voucher-sheet dl { row-gap: 0.5mm; }
        body { background: white !important; }
      }
    </style>
  `,
})
export class VoucherBulkPrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly voucherService = inject(VoucherDataService);
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly vouchers = signal<VoucherDetail[]>([]);
  protected readonly requested = signal(0);
  protected readonly failed = signal(0);
  private readonly activityTypes = signal<NomenclatorModel[]>([]);

  ngOnInit(): void {
    const idsParam = this.route.snapshot.queryParamMap.get('ids') || '';
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    this.requested.set(ids.length);

    if (ids.length === 0) {
      this.loading.set(false);
      return;
    }

    // Fetch activity types in parallel with vouchers
    this.api.getNomenclators('activity_types').subscribe({
      next: (list) => this.activityTypes.set(list ?? []),
    });

    forkJoin(ids.map((id) => this.voucherService.getVoucher(id))).subscribe({
      next: (results) => {
        this.vouchers.set(results);
        this.loading.set(false);
        // Auto-open the print dialog once everything is rendered
        setTimeout(() => window.print(), 400);
      },
      error: () => {
        this.failed.set(ids.length - this.vouchers().length);
        this.loading.set(false);
      },
    });
  }

  protected print(): void { window.print(); }

  protected activityLabel(code?: string): string {
    if (!code) return '—';
    const found = this.activityTypes().find((n) => n.code === code);
    return found?.titleRo || code;
  }

  protected cancelReasonLabel(code: CancellationReasonCode): string {
    const labels: Record<CancellationReasonCode, string> = {
      CA01: 'Eroare la emitere',
      CA02: 'Renuntare lucrator',
      CA03: 'Alt motiv',
    };
    return labels[code] || code;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const [y, m, day] = iso.split('-');
    return `${day}.${m}.${y}`;
  }

  protected formatDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${date} ${time}`;
  }

  protected formatMoney(n: number): string {
    return (Number(n) || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
