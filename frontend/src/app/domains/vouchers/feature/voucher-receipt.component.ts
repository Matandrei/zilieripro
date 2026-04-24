import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherDetail } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-voucher-receipt',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Toolbar (hidden on print) -->
      <div class="mb-4 flex items-center justify-between print:hidden">
        <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Inapoi la lista
        </a>
        <button type="button" (click)="print()"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Tipareste / Salveaza PDF
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">Se incarca chitanta...</div>
      } @else if (voucher()) {
        @let v = voucher()!;
        <div class="bg-white rounded-xl ring-1 ring-foreground/10 shadow-sm p-10 print:p-0 print:shadow-none print:ring-0">
          <!-- Header -->
          <div class="text-center border-b-2 border-foreground/30 pb-6 mb-6">
            <div class="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Platforma eSOCIAL · Modulul eZilier</div>
            <h1 class="text-2xl font-bold tracking-tight">CHITANTA VOUCHER</h1>
            <div class="mt-2 text-sm text-muted-foreground">
              pentru munca zilieri conform LP Nr. 22/2018
            </div>
            <div class="mt-3 font-mono text-lg font-bold text-primary">{{ v.code }}</div>
          </div>

          <!-- Parties -->
          <div class="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <div class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Beneficiar (Angajator)</div>
              <div class="space-y-1">
                <div class="font-semibold">{{ v.beneficiary.companyName }}</div>
                <div class="text-muted-foreground">IDNO: <span class="font-mono text-foreground">{{ v.beneficiary.idno }}</span></div>
                @if (v.beneficiary.legalForm) { <div class="text-muted-foreground">{{ v.beneficiary.legalForm }}</div> }
                @if (v.beneficiary.address) { <div class="text-muted-foreground">{{ v.beneficiary.address }}</div> }
              </div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Zilier</div>
              <div class="space-y-1">
                <div class="font-semibold">{{ v.worker.lastName }} {{ v.worker.firstName }}</div>
                <div class="text-muted-foreground">IDNP: <span class="font-mono text-foreground">{{ v.worker.idnp }}</span></div>
                @if (v.worker.phone) { <div class="text-muted-foreground">Tel: {{ v.worker.phone }}</div> }
                @if (v.worker.email) { <div class="text-muted-foreground">{{ v.worker.email }}</div> }
              </div>
            </div>
          </div>

          <!-- Work details -->
          <div class="rounded-md ring-1 ring-foreground/10 p-4 mb-6">
            <div class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Detalii prestare</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div class="text-xs text-muted-foreground">Data lucrului</div>
                <div class="font-semibold">{{ formatDate(v.workDate) }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Ore lucrate</div>
                <div class="font-semibold">{{ v.hoursWorked }} ore</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Raion</div>
                <div class="font-semibold">{{ v.workDistrict }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Localitate</div>
                <div class="font-semibold">{{ v.workLocality }}</div>
              </div>
              @if (v.workAddress) {
                <div class="md:col-span-4">
                  <div class="text-xs text-muted-foreground">Adresa</div>
                  <div class="font-semibold">{{ v.workAddress }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Financial -->
          <div class="rounded-md ring-1 ring-foreground/10 p-4 mb-6">
            <div class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Calcul remunerare</div>
            <table class="w-full text-sm">
              <tbody>
                <tr class="border-b border-foreground/5">
                  <td class="py-2">Remuneratie neta</td>
                  <td class="py-2 text-right font-semibold">{{ v.netRemuneration }} MDL</td>
                </tr>
                <tr class="border-b border-foreground/5">
                  <td class="py-2 text-muted-foreground">+ Impozit pe venit (12%)</td>
                  <td class="py-2 text-right">{{ v.incomeTax }} MDL</td>
                </tr>
                <tr class="border-b border-foreground/5">
                  <td class="py-2 text-muted-foreground">+ Contributii CNAS (6%)</td>
                  <td class="py-2 text-right">{{ v.cnasContribution }} MDL</td>
                </tr>
                <tr class="border-t-2 border-foreground/30">
                  <td class="py-3 font-semibold">Remuneratie bruta (total)</td>
                  <td class="py-3 text-right font-bold text-lg text-primary">{{ v.grossRemuneration }} MDL</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Status -->
          <div class="flex items-center justify-between mb-6 text-sm">
            <div>
              <span class="text-muted-foreground">Statut voucher: </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                [class.bg-gray-100]="v.status === 'Emis'"
                [class.text-gray-700]="v.status === 'Emis'"
                [class.bg-blue-100]="v.status === 'Activ'"
                [class.text-blue-700]="v.status === 'Activ'"
                [class.bg-green-100]="v.status === 'Executat' || v.status === 'Raportat'"
                [class.text-green-700]="v.status === 'Executat' || v.status === 'Raportat'"
                [class.bg-red-100]="v.status === 'Anulat'"
                [class.text-red-700]="v.status === 'Anulat'">
                {{ v.status }}
              </span>
            </div>
            <div class="text-xs text-muted-foreground">
              Emis: {{ formatDateTime(v.createdAt) }}
              @if (v.executedAt) { · Executat: {{ formatDateTime(v.executedAt) }} }
            </div>
          </div>

          <!-- Signatures -->
          <div class="grid grid-cols-2 gap-8 pt-6 border-t border-foreground/10">
            <div>
              <div class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Semnatura beneficiar</div>
              <div class="h-24 border-b border-foreground/30"></div>
              <div class="mt-1 text-xs text-muted-foreground">L.S.</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Semnatura zilier
                @if (voucher()?.signatureDataUrl) {
                  <span class="ml-2 inline-flex items-center gap-1 text-green-600 font-normal normal-case tracking-normal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3"><polyline points="20 6 9 17 4 12"/></svg>
                    semnat electronic
                  </span>
                }
              </div>
              <div class="h-24 border-b border-foreground/30 flex items-end justify-center">
                @if (voucher()?.signatureDataUrl) {
                  <img [src]="voucher()?.signatureDataUrl" alt="Semnatura" class="max-h-full object-contain" />
                }
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                @if (voucher()?.signedAt; as s) { Semnat: {{ formatDateTime(s) }} }
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 pt-4 border-t border-foreground/10 text-[10px] text-muted-foreground text-center">
            Document generat electronic prin Platforma eSOCIAL (eZilier) ·
            eZilier.gov.md · {{ now() }}
          </div>
        </div>
      } @else {
        <div class="text-center py-12 text-destructive">Voucherul nu a fost gasit.</div>
      }
    </div>

    <style>
      @media print {
        @page { size: A4; margin: 15mm; }
        body { background: white !important; }
      }
    </style>
  `,
})
export class VoucherReceiptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly voucherService = inject(VoucherDataService);

  protected readonly voucher = signal<VoucherDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly now = computed(() => new Date().toLocaleString('ro-RO'));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.voucherService.getVoucher(id).subscribe({
      next: (v) => {
        this.voucher.set(v);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected print(): void {
    window.print();
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
    return d.toLocaleString('ro-RO');
  }
}
