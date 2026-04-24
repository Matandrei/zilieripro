import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherDetail, VoucherStatus, CancellationReasonCode } from '../../../shared/models/voucher.model';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';
import { SignaturePadComponent } from '../../../shared/ui/components/signature-pad.component';

@Component({
  selector: 'app-voucher-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, SignaturePadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Inapoi la lista</a>
      </div>

      @if (voucher()) {
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-foreground">Voucher {{ voucher()!.code }}</h1>
              <div class="mt-1">
                <app-status-badge [status]="voucher()!.status" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Chitanta download available on all statuses -->
              <a [routerLink]="['/vouchers', voucher()!.id, 'receipt']"
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Chitanta
              </a>
              @if (voucher()!.status === 'Activ' || voucher()!.status === 'Executat') {
                <button type="button" (click)="showSignModal.set(true)"
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  @if (voucher()!.signatureDataUrl) { Resemneaza } @else { Semneaza }
                </button>
              }
              @if (voucher()!.status === 'Emis') {
                <a
                  [routerLink]="['/vouchers', voucher()!.id, 'edit']"
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  Editeaza
                </a>
                <button
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  (click)="activate()"
                >
                  Activeaza
                </button>
                <button
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium shadow-xs transition-all hover:bg-destructive/90"
                  (click)="showCancelModal.set(true)"
                >
                  Anuleaza
                </button>
              }
              @if (voucher()!.status === 'Activ') {
                <a
                  [routerLink]="['/vouchers', voucher()!.id, 'edit']"
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  Editeaza
                </a>
                <button
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  (click)="execute()"
                >
                  Executa
                </button>
                <button
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium shadow-xs transition-all hover:bg-destructive/90"
                  (click)="showCancelModal.set(true)"
                >
                  Anuleaza
                </button>
              }
              @if (voucher()!.status === 'Executat') {
                <button
                  class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  (click)="report()"
                >
                  Raporteaza
                </button>
              }
            </div>
          </div>

          <!-- Voucher details card -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Informatii voucher</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Cod:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.code }}</span>
              </div>
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Statut:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.status }}</span>
              </div>
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Data lucrului:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.workDate }}</span>
              </div>
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Ore lucrate:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.hoursWorked }}</span>
              </div>
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Raion:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.workDistrict }}</span>
              </div>
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Localitate:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.workLocality }}</span>
              </div>
              @if (voucher()!.workAddress) {
                <div class="flex justify-between border-b border-foreground/5 pb-2 md:col-span-2">
                  <span class="text-sm text-muted-foreground">Adresa:</span>
                  <span class="text-sm font-medium text-foreground">{{ voucher()!.workAddress }}</span>
                </div>
              }
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Creat la:</span>
                <span class="text-sm font-medium text-foreground">{{ formatDate(voucher()!.createdAt) }}</span>
              </div>
              @if (voucher()!.executedAt) {
                <div class="flex justify-between border-b border-foreground/5 pb-2">
                  <span class="text-sm text-muted-foreground">Executat la:</span>
                  <span class="text-sm font-medium text-foreground">{{ formatDate(voucher()!.executedAt!) }}</span>
                </div>
              }
              @if (voucher()!.reportedAt) {
                <div class="flex justify-between border-b border-foreground/5 pb-2">
                  <span class="text-sm text-muted-foreground">Raportat la:</span>
                  <span class="text-sm font-medium text-foreground">{{ formatDate(voucher()!.reportedAt!) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Worker info -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Informatii lucrator</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">IDNP:</span>
                <span class="text-sm font-medium text-foreground font-mono">{{ voucher()!.worker.idnp }}</span>
              </div>
              <div class="flex justify-between border-b border-foreground/5 pb-2">
                <span class="text-sm text-muted-foreground">Nume complet:</span>
                <span class="text-sm font-medium text-foreground">{{ voucher()!.worker.firstName }} {{ voucher()!.worker.lastName }}</span>
              </div>
              @if (voucher()!.worker.phone) {
                <div class="flex justify-between border-b border-foreground/5 pb-2">
                  <span class="text-sm text-muted-foreground">Telefon:</span>
                  <span class="text-sm font-medium text-foreground">{{ voucher()!.worker.phone }}</span>
                </div>
              }
              @if (voucher()!.worker.email) {
                <div class="flex justify-between border-b border-foreground/5 pb-2">
                  <span class="text-sm text-muted-foreground">Email:</span>
                  <span class="text-sm font-medium text-foreground">{{ voucher()!.worker.email }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Cancellation info -->
          @if (voucher()!.status === 'Anulat') {
            <div class="bg-destructive/10 rounded-xl ring-1 ring-destructive/20 p-6">
              <h2 class="text-lg font-semibold text-destructive mb-4">Informatii anulare</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex justify-between">
                  <span class="text-sm text-destructive">Motiv:</span>
                  <span class="text-sm font-medium text-destructive">{{ cancelReasonLabel(voucher()!.cancellationReason!) }}</span>
                </div>
                @if (voucher()!.cancellationNote) {
                  <div class="flex justify-between">
                    <span class="text-sm text-destructive">Nota:</span>
                    <span class="text-sm font-medium text-destructive">{{ voucher()!.cancellationNote }}</span>
                  </div>
                }
                @if (voucher()!.cancellationDate) {
                  <div class="flex justify-between">
                    <span class="text-sm text-destructive">Data anulare:</span>
                    <span class="text-sm font-medium text-destructive">{{ voucher()!.cancellationDate }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else if (loading()) {
        <div class="flex items-center justify-center py-12">
          <p class="text-muted-foreground">Se incarca...</p>
        </div>
      } @else {
        <div class="flex items-center justify-center py-12">
          <p class="text-destructive text-sm font-medium">Voucherul nu a fost gasit.</p>
        </div>
      }

      <!-- Cancel Modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold text-foreground mb-4">Anulare voucher</h3>
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Motiv anulare</label>
                <select
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  [(ngModel)]="cancelReasonCode"
                >
                  <option value="CA01">CA01 - Eroare la emitere</option>
                  <option value="CA02">CA02 - Renuntare lucrator</option>
                  <option value="CA03">CA03 - Alt motiv</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Nota (optional)</label>
                <textarea
                  class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] min-h-[80px] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  rows="3"
                  [(ngModel)]="cancelNote"
                  placeholder="Adaugati o nota..."
                ></textarea>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                (click)="showCancelModal.set(false)"
              >
                Renunta
              </button>
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium shadow-xs transition-all hover:bg-destructive/90"
                (click)="confirmCancel()"
              >
                Confirma anularea
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Signature modal (US-A19) -->
      @if (showSignModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" (click)="showSignModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-foreground mb-1">Semnatura zilier</h3>
            <p class="text-sm text-muted-foreground mb-4">Oferiti dispozitivul zilierului (telefon/tableta) pentru a semna. Semnatura se salveaza pe voucher si apare pe chitanta.</p>
            <app-signature-pad (changed)="signatureData.set($event)" />
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="showSignModal.set(false)"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">Anuleaza</button>
              <button type="button" (click)="saveSignature()" [disabled]="!signatureData() || saving()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (saving()) { Se salveaza... } @else { Salveaza semnatura }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
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
      .cancelVoucher(this.voucher()!.id, {
        reason: this.cancelReasonCode,
        note: this.cancelNote || undefined,
      })
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
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  private loadVoucher(id: string): void {
    this.loading.set(true);
    this.voucherDataService.getVoucher(id).subscribe({
      next: (v) => {
        this.voucher.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
