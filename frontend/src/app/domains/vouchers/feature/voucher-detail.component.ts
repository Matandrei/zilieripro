import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherDetail, VoucherStatus, CancellationReasonCode } from '../../../shared/models/voucher.model';
import { SignaturePadComponent } from '../../../shared/ui/components/signature-pad.component';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-voucher-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, SignaturePadComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Toolbar (hidden on print) -->
      <div class="mb-4 flex items-center justify-between print:hidden">
        <a routerLink="/vouchers"
           class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; {{ 'worker.profile.back' | t }}
        </a>
        @if (voucher()) {
          <div class="flex items-center gap-2">
            @if (voucher()!.status === 'Activ' || voucher()!.status === 'Executat') {
              <button type="button" (click)="showSignModal.set(true)"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                {{ (voucher()!.signatureDataUrl ? 'action.resign' : 'action.sign') | t }}
              </button>
            }
            @if (voucher()!.status === 'Emis') {
              <a [routerLink]="['/vouchers', voucher()!.id, 'edit']"
                 class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                {{ 'action.edit' | t }}
              </a>
              <button type="button" (click)="activate()"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                {{ 'action.activate' | t }}
              </button>
              <button type="button" (click)="showCancelModal.set(true)"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90">
                {{ 'action.cancel' | t }}
              </button>
            }
            @if (voucher()!.status === 'Activ') {
              <button type="button" (click)="execute()"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                {{ 'action.execute' | t }}
              </button>
              <button type="button" (click)="showCancelModal.set(true)"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90">
                {{ 'action.cancel' | t }}
              </button>
            }
            @if (voucher()!.status === 'Executat') {
              <button type="button" (click)="report()"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                {{ 'action.report' | t }}
              </button>
            }
            <button type="button" (click)="print()"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">{{ 'common.loading' | t }}</div>
      } @else if (voucher()) {
        @let v = voucher()!;
        <!-- Simple anexa layout, same on screen and print (signatures only on print) -->
        <div class="voucher-sheet bg-white ring-1 ring-foreground/10 rounded-md mx-auto
                    print:ring-0 print:rounded-none">

          <!-- HEADER -->
          <div class="px-8 pt-8 pb-4 text-center border-b border-foreground/20">
            <div class="text-xs uppercase tracking-widest text-foreground/70 font-semibold">
              Ministerul Muncii si Protectiei Sociale
            </div>
            <h1 class="mt-2 text-2xl font-bold uppercase tracking-tight">
              Voucher digital pentru zilieri
            </h1>
            <div class="mt-3 flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs">
              <div><span class="text-foreground/60">COD:</span> <span class="font-mono font-bold">{{ v.code }}</span></div>
              <div><span class="text-foreground/60">EMIS:</span> <span class="font-medium">{{ formatDateTime(v.createdAt) }}</span></div>
              <div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-foreground/30">
                  {{ v.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- BENEFICIAR -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider mb-3">Beneficiarul de lucrari (Angajator)</h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-foreground/70">IDNO</dt>
              <dd class="font-mono font-semibold">{{ v.beneficiary.idno }}</dd>
              <dt class="text-foreground/70">Denumirea companiei</dt>
              <dd class="font-semibold">{{ v.beneficiary.companyName }}</dd>
            </dl>
          </section>

          <!-- ZILIER -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider mb-3">Zilierul (Lucrator)</h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-foreground/70">IDNP</dt>
              <dd class="font-mono font-semibold">{{ v.worker.idnp }}</dd>
              <dt class="text-foreground/70">Numele</dt>
              <dd class="font-semibold uppercase">{{ v.worker.lastName }}</dd>
              <dt class="text-foreground/70">Prenumele</dt>
              <dd class="font-semibold">{{ v.worker.firstName }}</dd>
            </dl>
          </section>

          <!-- DETALII ACTIVITATE -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider mb-3">Detalii activitate</h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-foreground/70">Ziua de activitate</dt>
              <dd class="font-semibold">{{ formatDate(v.workDate) }}</dd>
              <dt class="text-foreground/70">Numarul de ore lucrate</dt>
              <dd class="font-semibold">{{ v.hoursWorked }}</dd>
              <dt class="text-foreground/70">Locul exercitarii activitatii</dt>
              <dd class="font-semibold">
                {{ v.workLocality }}, {{ v.workDistrict }}
                @if (v.workAddress) { <br/><span class="text-foreground/70 font-normal">{{ v.workAddress }}</span> }
              </dd>
              <dt class="text-foreground/70">Activitatea realizata</dt>
              <dd class="font-semibold">Zilier agricultura</dd>
            </dl>
          </section>

          <!-- DATE FINANCIARE -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider mb-3">Date financiare</h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-foreground/70">Remuneratia neta (MDL)</dt>
              <dd class="font-semibold">{{ formatMoney(v.netRemuneration) }}</dd>
              <dt class="text-foreground/70">Impozit pe venit 12% (MDL)</dt>
              <dd class="font-semibold">{{ formatMoney(v.incomeTax) }}</dd>
              <dt class="text-foreground/70">Contributii CNAS 6% (MDL)</dt>
              <dd class="font-semibold">{{ formatMoney(v.cnasContribution) }}</dd>
            </dl>
            <div class="mt-3 pt-3 border-t-2 border-foreground/40 grid grid-cols-[180px_1fr] gap-x-4">
              <div class="text-sm font-bold uppercase tracking-wider">Remuneratia bruta (MDL)</div>
              <div class="text-lg font-bold">{{ formatMoney(v.grossRemuneration) }}</div>
            </div>
          </section>

          <!-- CONFIRMARE -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider mb-2">Confirmarea prestarii si primirii remuneratiei</h2>
            <p class="text-xs text-foreground/80 leading-relaxed">
              Prin semnarea prezentului voucher, zilierul confirma prestarea activitatii
              si primirea remuneratiei in cuantumul indicat mai sus.
            </p>
          </section>

          <!-- CANCELLATION (if applicable) -->
          @if (v.status === 'Anulat') {
            <section class="px-8 py-4 border-b border-foreground/10">
              <h2 class="text-[11px] font-bold uppercase tracking-wider mb-2 text-destructive">Voucher anulat</h2>
              <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
                <dt class="text-foreground/70">Motiv</dt>
                <dd class="font-semibold">{{ cancelReasonLabel(v.cancellationReason!) }}</dd>
                @if (v.cancellationNote) {
                  <dt class="text-foreground/70">Nota</dt>
                  <dd>{{ v.cancellationNote }}</dd>
                }
                @if (v.cancellationDate) {
                  <dt class="text-foreground/70">Data anularii</dt>
                  <dd class="font-semibold">{{ formatDateTime(v.cancellationDate) }}</dd>
                }
              </dl>
            </section>
          }

          <!-- SIGNATURE AREA — only on print -->
          <section class="px-8 py-6 signature-area">
            <div class="grid grid-cols-2 gap-8">
              <div>
                <div class="text-[10px] uppercase tracking-widest text-foreground/70 font-semibold mb-6">
                  Semnatura zilierului (olografa)
                </div>
                <div class="h-16 border-b border-foreground/40"></div>
              </div>
              <div>
                <div class="text-[10px] uppercase tracking-widest text-foreground/70 font-semibold mb-2">
                  Semnatura electronica a entitatii
                </div>
                @if (v.signatureDataUrl) {
                  <div class="h-16 border-b border-foreground/40 flex items-end justify-center">
                    <img [src]="v.signatureDataUrl" alt="Semnatura electronica" class="max-h-full object-contain" />
                  </div>
                  <div class="text-[10px] text-foreground/60 mt-1">
                    @if (v.signedAt; as s) { {{ formatDateTime(s) }} }
                  </div>
                } @else {
                  <div class="h-16 border-b border-foreground/40 flex items-center justify-center">
                    <span class="text-[10px] text-foreground/60 italic">[Aplicata automat la imprimare]</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- FOOTER -->
          <div class="px-8 py-4 text-[10px] text-center text-foreground/70 italic">
            Prezentul voucher constituie dovada remuneratiei zilierului — Art. 9 alin. (3), Legea nr. 22/2018.<br/>
            Document generat automat din sistemul informational eZilier.
          </div>
        </div>
      }

      <!-- Cancel modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 print:hidden" (click)="showCancelModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-4">{{ 'voucher.detail.cancelModal' | t }}</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">{{ 'field.reason' | t }}</label>
                <select [(ngModel)]="cancelReasonCode"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm">
                  <option value="CA01">CA01 — Eroare la emitere</option>
                  <option value="CA02">CA02 — Renuntare lucrator</option>
                  <option value="CA03">CA03 — Alt motiv</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">{{ 'field.note' | t }}</label>
                <textarea [(ngModel)]="cancelNote" rows="3"
                  class="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm"></textarea>
              </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="showCancelModal.set(false)"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">{{ 'action.close' | t }}</button>
              <button type="button" (click)="confirmCancel()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-destructive text-white px-4 text-sm font-medium">{{ 'voucher.detail.confirmCancel' | t }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Signature modal -->
      @if (showSignModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 print:hidden" (click)="showSignModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-1">{{ 'voucher.detail.signModal' | t }}</h3>
            <p class="text-sm text-muted-foreground mb-4">{{ 'voucher.detail.signModalHint' | t }}</p>
            <app-signature-pad (changed)="signatureData.set($event)" />
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="showSignModal.set(false)"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">{{ 'action.cancel' | t }}</button>
              <button type="button" (click)="saveSignature()" [disabled]="!signatureData() || saving()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (saving()) { {{ 'common.processing' | t }} } @else { {{ 'voucher.detail.saveSignature' | t }} }
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <style>
      /* A5 aspect on screen */
      :host ::ng-deep .voucher-sheet { max-width: 148mm; min-height: auto; }

      /* On-screen: hide the signature section — it appears only at print. */
      :host ::ng-deep .signature-area { display: none; }

      @media print {
        :host ::ng-deep .signature-area { display: block !important; }
        @page { size: A5 portrait; margin: 8mm; }
        :host ::ng-deep .voucher-sheet { width: 100%; box-shadow: none !important; border-radius: 0 !important; }
        body { background: white !important; }
      }
    </style>
  `,
})
export class VoucherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly voucherDataService = inject(VoucherDataService);

  protected readonly voucher = signal<VoucherDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly showCancelModal = signal(false);
  protected readonly showSignModal = signal(false);
  protected readonly signatureData = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected cancelReasonCode = 'CA01';
  protected cancelNote = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadVoucher(id);
  }

  protected print(): void { window.print(); }

  protected activate(): void {
    this.voucherDataService.activateVoucher(this.voucher()!.id).subscribe({
      next: (v) => this.voucher.set(v),
    });
  }

  protected execute(): void {
    this.voucherDataService.executeVoucher(this.voucher()!.id).subscribe({
      next: (v) => this.voucher.set(v),
    });
  }

  protected report(): void {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.voucherDataService.reportVoucher(this.voucher()!.id, period).subscribe({
      next: (v) => this.voucher.set(v),
    });
  }

  protected saveSignature(): void {
    const data = this.signatureData();
    if (!data) return;
    this.saving.set(true);
    this.voucherDataService.signVoucher(this.voucher()!.id, data).subscribe({
      next: (v) => {
        this.voucher.set(v);
        this.saving.set(false);
        this.showSignModal.set(false);
        this.signatureData.set(null);
      },
      error: () => this.saving.set(false),
    });
  }

  protected confirmCancel(): void {
    this.voucherDataService
      .cancelVoucher(this.voucher()!.id, { reason: this.cancelReasonCode, note: this.cancelNote || undefined })
      .subscribe({
        next: (v) => {
          this.voucher.set(v);
          this.showCancelModal.set(false);
          this.cancelReasonCode = 'CA01';
          this.cancelNote = '';
        },
      });
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

  private loadVoucher(id: string): void {
    this.loading.set(true);
    this.voucherDataService.getVoucher(id).subscribe({
      next: (v) => { this.voucher.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
