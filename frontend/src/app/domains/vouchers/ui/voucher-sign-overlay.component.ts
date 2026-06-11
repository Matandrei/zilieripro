import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import { SignaturePadComponent } from '../../../shared/ui/components/signature-pad.component';

@Component({
  selector: 'app-voucher-sign-overlay',
  standalone: true,
  imports: [SignaturePadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <!-- Backdrop (desktop only) -->
    <div
      class="fixed inset-0 z-[290] bg-black/50 backdrop-blur-sm hidden sm:block"
      (click)="onBackdropClick()"
      aria-hidden="true"
    ></div>

    <!-- Main overlay panel -->
    <div
      class="fixed inset-0 z-[300] flex flex-col bg-white
             sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
             sm:w-[520px] sm:max-h-[92vh] sm:rounded-3xl sm:shadow-2xl sm:overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Semnătură digitală voucher"
    >
      <!-- ─── Header ─── -->
      <div
        class="flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0"
        style="padding-top: max(12px, env(safe-area-inset-top)); padding-bottom: 12px;"
      >
        <button
          type="button"
          (click)="onBackdropClick()"
          class="flex items-center justify-center size-10 -ml-1.5 rounded-full
                 text-gray-400 hover:text-gray-700 hover:bg-gray-100
                 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Închide"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="text-center">
          <p class="text-sm font-semibold text-gray-900">Semnătură digitală</p>
          <p class="text-[11px] text-gray-400">voucher {{ code() }}</p>
        </div>

        <div class="size-10"></div>
      </div>

      <!-- ─── Voucher summary ─── -->
      <div class="px-4 py-3 bg-blue-50 border-b border-blue-100 shrink-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-blue-500 mb-0.5">
              Voucher de confirmat
            </p>
            <p class="text-lg font-bold text-gray-900 leading-tight truncate">{{ workerName() }}</p>
            <p class="text-sm text-gray-500 mt-0.5">{{ workDate() }}</p>
          </div>
          <div class="text-right shrink-0 bg-white rounded-xl px-3 py-2 shadow-sm border border-blue-100">
            <p class="text-[10px] text-gray-400 uppercase tracking-wide">Remunerare netă</p>
            <p class="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{{ netAmount() }}</p>
            <p class="text-[11px] font-semibold text-blue-600">MDL</p>
          </div>
        </div>
      </div>

      <!-- ─── Instruction ─── -->
      <div class="px-4 pt-3 pb-1 shrink-0">
        <p class="text-[13px] text-gray-500 text-center leading-relaxed">
          Semnați în zona de mai jos pentru a confirma prestarea activității și primirea remunerației
        </p>
      </div>

      <!-- ─── Signature canvas — flex-1 ─── -->
      <div class="flex-1 px-4 pt-1 pb-2 overflow-hidden min-h-[180px]">
        <app-signature-pad
          [fixedHeight]="sigHeight()"
          (changed)="onSignatureChanged($event)"
        />
      </div>

      <!-- ─── Footer ─── -->
      <div
        class="px-4 pt-3 border-t border-gray-100 bg-white shrink-0 space-y-2.5"
        style="padding-bottom: max(16px, env(safe-area-inset-bottom));"
      >
        <p class="text-[11px] text-gray-400 text-center leading-relaxed px-2">
          Prin semnarea prezentului voucher confirm prestarea activității indicate și
          primirea remunerației nete de
          <strong class="text-gray-600">{{ netAmount() }} MDL</strong>
          în data de {{ workDate() }}.
        </p>

        <button
          type="button"
          (click)="requestConfirm()"
          [disabled]="!signatureData() || saving()"
          class="w-full rounded-2xl text-[15px] font-semibold leading-none transition-all
                 active:scale-[0.97] touch-manipulation select-none disabled:cursor-not-allowed"
          style="height: 56px;"
          [class]="btnClass()"
        >
          @if (saving()) {
            <span class="flex items-center justify-center gap-2">
              <svg class="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
                        stroke-dasharray="31.4 62.8" stroke-linecap="round"/>
              </svg>
              Se salvează...
            </span>
          } @else if (signatureData()) {
            <span class="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
              Semnez și confirm primirea remunerației
            </span>
          } @else {
            <span class="flex items-center justify-center gap-2 opacity-60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07
                     a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"/>
              </svg>
              Semnați în zona de mai sus
            </span>
          }
        </button>
      </div>

      <!-- ─── Confirmation bottom-sheet (absolute, within panel stacking context) ─── -->
      @if (showConfirm()) {
        <div
          class="absolute inset-0 z-10 flex flex-col justify-end"
          style="background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);"
          (click)="showConfirm.set(false)"
        >
          <div
            class="bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl
                   sm:mx-6 sm:mb-6 sm:rounded-3xl"
            (click)="$event.stopPropagation()"
          >
            <!-- Icon + title -->
            <div class="flex items-center gap-3">
              <div class="size-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-green-600">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07
                       a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"/>
                </svg>
              </div>
              <div>
                <p class="text-base font-bold text-gray-900">Confirmați semnătura?</p>
                <p class="text-sm text-gray-500">{{ workerName() }}</p>
              </div>
            </div>

            <!-- Details summary -->
            <div class="bg-gray-50 rounded-2xl px-4 py-3 space-y-1.5">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Voucher</span>
                <span class="font-mono font-semibold text-gray-800">{{ code() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Data activității</span>
                <span class="text-gray-800">{{ workDate() }}</span>
              </div>
              <div class="flex justify-between text-sm border-t border-gray-200 pt-1.5 mt-0.5">
                <span class="text-gray-500">Remunerare netă</span>
                <span class="text-lg font-bold text-gray-900 tabular-nums">{{ netAmount() }} MDL</span>
              </div>
            </div>

            <!-- Confirmation text -->
            <p class="text-[13px] text-gray-500 leading-relaxed text-center">
              Prin confirmare, declarați că ați prestat activitatea indicată și ați primit
              suma de <strong class="text-gray-700">{{ netAmount() }} MDL</strong>.
              Această acțiune nu poate fi anulată.
            </p>

            <!-- Action buttons -->
            <div class="flex gap-3">
              <button
                type="button"
                (click)="showConfirm.set(false)"
                class="flex-1 h-12 rounded-2xl border border-gray-200 text-sm font-semibold
                       text-gray-700 hover:bg-gray-50 active:bg-gray-100
                       transition-colors touch-manipulation"
              >
                Renunță
              </button>
              <button
                type="button"
                (click)="submitSignature()"
                class="flex-[2] h-12 rounded-2xl bg-green-600 text-white text-sm font-bold
                       hover:bg-green-700 active:bg-green-800 shadow-lg shadow-green-200
                       transition-colors touch-manipulation"
              >
                Da, semnez și confirm
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class VoucherSignOverlayComponent implements OnInit {
  readonly code = input.required<string>();
  readonly workerName = input.required<string>();
  readonly workDate = input.required<string>();
  readonly netAmount = input.required<string>();
  readonly saving = input<boolean>(false);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  protected readonly signatureData = signal<string | null>(null);
  protected readonly showConfirm = signal(false);
  protected readonly sigHeight = signal(260);

  protected readonly btnClass = () => {
    if (this.saving()) return 'bg-gray-100 text-gray-500';
    if (this.signatureData()) return 'bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700 active:bg-green-800';
    return 'bg-gray-100 text-gray-500';
  };

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showConfirm()) {
      this.showConfirm.set(false);
    } else if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  ngOnInit(): void {
    const vh = window.innerHeight;
    // header~58 + summary~80 + hint~48 + footer~130 ≈ 316px overhead
    const available = vh - 316;
    this.sigHeight.set(Math.max(180, Math.min(available, 380)));
  }

  protected onBackdropClick(): void {
    if (!this.saving()) this.cancelled.emit();
  }

  protected onSignatureChanged(data: string | null): void {
    this.signatureData.set(data);
  }

  protected requestConfirm(): void {
    if (this.signatureData() && !this.saving()) {
      this.showConfirm.set(true);
    }
  }

  protected submitSignature(): void {
    const data = this.signatureData();
    if (data) {
      this.showConfirm.set(false);
      this.confirmed.emit(data);
    }
  }
}
