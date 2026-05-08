import { ChangeDetectionStrategy, Component, computed, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { WorkerDataService } from '../data/worker-data.service';
import { WorkerModel } from '../../../shared/models/voucher.model';
import { optionalEmailValidator, optionalPhoneValidator } from '../../../shared/validators/optional-contact.validators';

@Component({
  selector: 'app-worker-edit',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" (click)="cancel()">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="p-6 pb-4 border-b border-foreground/10 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold">Editare lucrator</h3>
            <p class="text-sm text-muted-foreground">Datele de identificare sunt sincronizate cu RSP si nu pot fi modificate.</p>
          </div>
          <button type="button" aria-label="Inchide"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            (click)="cancel()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3" [formGroup]="form">
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground">IDNP</label>
              <input type="text" [value]="worker.idnp" readonly
                class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm font-mono text-muted-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground">Data nasterii</label>
              <input type="text" [value]="worker.birthDate" readonly
                class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground">Nume</label>
              <input type="text" [value]="worker.lastName" readonly
                class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground">Prenume</label>
              <input type="text" [value]="worker.firstName" readonly
                class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground">Telefon</label>
              <input type="tel" formControlName="phone" placeholder="+37360123456"
                class="flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm"
                [class.border-destructive]="phoneError()"
                [class.border-input]="!phoneError()" />
              @if (phoneError(); as msg) {
                <p class="text-xs text-destructive">{{ msg }}</p>
              }
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-muted-foreground">Email</label>
              <input type="email" formControlName="email" placeholder="nume@domeniu.md"
                class="flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm"
                [class.border-destructive]="emailError()"
                [class.border-input]="!emailError()" />
              @if (emailError(); as msg) {
                <p class="text-xs text-destructive">{{ msg }}</p>
              }
            </div>
          </div>

          @if (genericError()) {
            <div class="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">{{ genericError() }}</div>
          }
        </div>

        <div class="p-6 pt-4 border-t border-foreground/10 flex justify-end gap-2">
          <button type="button" (click)="cancel()" [disabled]="submitting()"
            class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm disabled:opacity-50">
            Anuleaza
          </button>
          <button type="button" (click)="submit()" [disabled]="submitting() || form.invalid"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
            @if (submitting()) {
              <svg class="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v4m0 8v4m8-8h-4M8 12H4m13.657-5.657l-2.828 2.828M9.172 14.828l-2.829 2.829m0-11.314l2.829 2.829m5.656 5.656l2.828 2.828" />
              </svg>
              Salvare...
            } @else {
              Salveaza
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class WorkerEditComponent {
  @Input({ required: true }) worker!: WorkerModel;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<WorkerModel>();

  private readonly fb = inject(FormBuilder);
  private readonly workerDataService = inject(WorkerDataService);

  protected readonly submitting = signal(false);
  protected readonly genericError = signal('');
  protected readonly serverFieldErrors = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    phone: ['', [optionalPhoneValidator]],
    email: ['', [optionalEmailValidator]],
  });

  protected readonly phoneError = computed(() => this.fieldError('phone', {
    phoneFormat: 'Numarul trebuie sa fie in format Moldova: +373 urmat de 8 cifre.',
  }));

  protected readonly emailError = computed(() => this.fieldError('email', {
    email: 'Format email invalid (ex: nume@domeniu.md).',
  }));

  ngOnInit(): void {
    this.form.patchValue({
      phone: this.worker.phone ?? '',
      email: this.worker.email ?? '',
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancel();
  }

  protected cancel(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const phone = (v.phone ?? '').trim();
    const email = (v.email ?? '').trim();

    this.submitting.set(true);
    this.genericError.set('');
    this.serverFieldErrors.set({});

    this.workerDataService.updateWorker(this.worker.id, {
      phone: phone || null,
      email: email || null,
    }).subscribe({
      next: (model) => {
        this.submitting.set(false);
        this.saved.emit(model);
      },
      error: (err) => {
        this.submitting.set(false);
        this.applyServerErrors(err);
      },
    });
  }

  private applyServerErrors(err: unknown): void {
    const e = err as { status?: number; error?: { errors?: Array<{ propertyName?: string; errorMessage?: string }>; message?: string } };
    const errors = e?.error?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const map: Record<string, string> = {};
      for (const f of errors) {
        const key = (f.propertyName ?? '').toLowerCase();
        if (key && f.errorMessage) map[key] = f.errorMessage;
      }
      this.serverFieldErrors.set(map);
      if (!map['phone'] && !map['email']) {
        this.genericError.set(errors[0].errorMessage ?? 'Eroare la salvare.');
      }
      return;
    }
    if (e?.status === 404) {
      this.genericError.set('Lucratorul nu a fost gasit. Reincarcati lista.');
      return;
    }
    if (e?.status === 409) {
      this.genericError.set('Inregistrarea a fost modificata. Reincarcati.');
      return;
    }
    this.genericError.set(typeof e?.error?.message === 'string' ? e.error!.message! : 'Eroare la salvarea lucratorului.');
  }

  private fieldError(name: 'phone' | 'email', clientMap: Record<string, string>): string | null {
    const server = this.serverFieldErrors()[name];
    if (server) return server;
    const ctrl = this.form.controls[name];
    if (!ctrl.touched || !ctrl.errors) return null;
    for (const key of Object.keys(ctrl.errors)) {
      if (clientMap[key]) return clientMap[key];
    }
    return null;
  }
}
