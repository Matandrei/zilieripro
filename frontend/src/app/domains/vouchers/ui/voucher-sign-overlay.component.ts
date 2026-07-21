import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
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

      <!-- ─── Footer — declaratia si confirmarea sunt inline, fara dialog separat ─── -->
      <div
        class="px-4 pt-3 border-t border-gray-100 bg-white shrink-0 space-y-2.5"
        style="padding-bottom: max(16px, env(safe-area-inset-bottom));"
      >
        <!-- Declaratie: gest deliberat pentru o actiune ireversibila -->
        <label
          class="flex items-start gap-3 rounded-2xl border px-3.5 py-3 cursor-pointer
                 transition-colors touch-manipulation select-none"
          [class]="declarationBoxClass()"
        >
          <input
            type="checkbox"
            [checked]="declarationAccepted()"
            (change)="toggleDeclaration()"
            [disabled]="saving()"
            class="mt-0.5 size-5 shrink-0 rounded-md border-gray-300 text-green-600
                   accent-green-600 cursor-pointer disabled:cursor-not-allowed"
          />
          <span class="text-[12.5px] leading-relaxed text-gray-600">
            Confirm că am prestat activitatea indicată și am primit remunerația netă de
            <strong class="text-gray-900">{{ netAmount() }} MDL</strong>
            în data de {{ workDate() }}.
            <span class="text-amber-700 font-medium">Această acțiune nu poate fi anulată.</span>
          </span>
        </label>

        <button
          type="button"
          (click)="submitSignature()"
          [disabled]="!canSubmit() || saving()"
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
          } @else if (canSubmit()) {
            <span class="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
              Da, semnez și confirm
            </span>
          } @else if (signatureData()) {
            <span class="flex items-center justify-center gap-2 opacity-60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              Bifați declarația de mai sus
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
  protected readonly declarationAccepted = signal(false);
  protected readonly sigHeight = signal(260);

  protected readonly canSubmit = computed(
    () => this.signatureData() !== null && this.declarationAccepted()
  );

  protected readonly btnClass = () => {
    if (this.saving()) return 'bg-gray-100 text-gray-500';
    if (this.canSubmit()) return 'bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700 active:bg-green-800';
    return 'bg-gray-100 text-gray-500';
  };

  protected readonly declarationBoxClass = () => {
    if (this.declarationAccepted()) return 'border-green-300 bg-green-50/60';
    if (this.signatureData()) return 'border-amber-300 bg-amber-50/50';
    return 'border-gray-200 bg-gray-50/60';
  };

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.saving()) this.cancelled.emit();
  }

  ngOnInit(): void {
    const vh = window.innerHeight;
    // header~58 + summary~80 + hint~48 + footer~200 (declaratie + buton) ≈ 386px overhead
    const available = vh - 386;
    this.sigHeight.set(Math.max(160, Math.min(available, 340)));
  }

  protected onBackdropClick(): void {
    if (!this.saving()) this.cancelled.emit();
  }

  protected onSignatureChanged(data: string | null): void {
    this.signatureData.set(data);
    // Stergerea semnaturii invalideaza si declaratia.
    if (data === null) this.declarationAccepted.set(false);
  }

  protected toggleDeclaration(): void {
    if (!this.saving()) this.declarationAccepted.update((v) => !v);
  }

  protected submitSignature(): void {
    const data = this.signatureData();
    if (data && this.canSubmit() && !this.saving()) {
      this.confirmed.emit(data);
    }
  }
}
