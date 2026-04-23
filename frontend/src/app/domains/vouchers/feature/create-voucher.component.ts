import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { WorkerDataService } from '../../workers/data/worker-data.service';
import { VoucherCreatedSummary, WorkerModel } from '../../../shared/models/voucher.model';

interface WorkerTax {
  net: number;
  tax: number;
  cnas: number;
  gross: number;
}

@Component({
  selector: 'app-create-voucher',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Inapoi la lista</a>
        <h1 class="text-3xl font-bold tracking-tight text-foreground mt-2">Creare voucher nou</h1>
        <p class="text-sm text-muted-foreground mt-1">Pasul 1: selectati sau adaugati lucratorii. Pasul 2: completati datele voucherului.</p>
      </div>

      @if (!createdSummary()) {
        <!-- STEP 1: Worker selection -->
        @if (selectedWorkers().length === 0 || showWorkerPicker()) {
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Pasul 1 — Lucratori</h2>
                <p class="text-xs text-muted-foreground">Selectati lucratori existenti sau adaugati unul nou.</p>
              </div>
              @if (selectedWorkers().length > 0) {
                <button
                  type="button"
                  class="text-xs text-muted-foreground hover:text-foreground"
                  (click)="showWorkerPicker.set(false)"
                >Anuleaza</button>
              }
            </div>

            <!-- Tab switcher -->
            <div class="flex gap-2 mb-4 border-b border-foreground/10">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium relative transition-colors"
                [class]="mode() === 'existing' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
                (click)="mode.set('existing')"
              >
                Lucratori existenti
                @if (mode() === 'existing') {
                  <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></span>
                }
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium relative transition-colors"
                [class]="mode() === 'new' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
                (click)="mode.set('new')"
              >
                + Adauga lucrator nou
                @if (mode() === 'new') {
                  <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></span>
                }
              </button>
            </div>

            @if (mode() === 'existing') {
              <!-- Search + list existing workers -->
              <div class="relative mb-3">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  [value]="searchTerm()"
                  (input)="searchTerm.set($any($event.target).value)"
                  placeholder="Cauta dupa IDNP, nume, prenume..."
                  class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              <div class="max-h-80 overflow-auto rounded-md ring-1 ring-foreground/10">
                @if (loadingWorkers()) {
                  <div class="p-6 text-center text-sm text-muted-foreground">Se incarca...</div>
                } @else if (filteredWorkers().length === 0) {
                  <div class="p-6 text-center text-sm text-muted-foreground">Nu au fost gasiti lucratori.</div>
                } @else {
                  <table class="w-full text-sm">
                    <thead class="bg-muted/50">
                      <tr class="text-left text-xs text-muted-foreground">
                        <th class="p-2 w-8"></th>
                        <th class="p-2">Nume complet</th>
                        <th class="p-2">IDNP</th>
                        <th class="p-2">RSP</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (w of filteredWorkers(); track w.id) {
                        <tr class="border-t border-foreground/10 hover:bg-muted/30 cursor-pointer" (click)="toggleWorker(w)">
                          <td class="p-2">
                            <input type="checkbox" [checked]="isSelected(w.id)" (click)="$event.stopPropagation()" (change)="toggleWorker(w)" class="rounded border-input" />
                          </td>
                          <td class="p-2 font-medium">{{ w.firstName }} {{ w.lastName }}</td>
                          <td class="p-2 font-mono text-xs">{{ w.idnp }}</td>
                          <td class="p-2">
                            @if (w.rspValidated) {
                              <span class="inline-flex items-center gap-1 text-xs text-green-600"><span class="size-1.5 rounded-full bg-green-500"></span>Validat</span>
                            } @else {
                              <span class="inline-flex items-center gap-1 text-xs text-muted-foreground"><span class="size-1.5 rounded-full bg-gray-400"></span>Nevalidat</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            } @else {
              <!-- Add new worker inline -->
              <form [formGroup]="newWorkerForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">IDNP *</label>
                  <input type="text" formControlName="idnp" maxlength="13" placeholder="13 cifre" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Prenume *</label>
                  <input type="text" formControlName="firstName" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Nume *</label>
                  <input type="text" formControlName="lastName" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Data nasterii *</label>
                  <input type="date" formControlName="birthDate" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Telefon</label>
                  <input type="tel" formControlName="phone" placeholder="Optional" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Email</label>
                  <input type="email" formControlName="email" placeholder="Optional" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="md:col-span-3 flex justify-end">
                  <button type="button" (click)="addNewWorker()" [disabled]="newWorkerForm.invalid"
                    class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                    + Adauga lucrator
                  </button>
                </div>
              </form>
            }

            <div class="mt-4 flex justify-end">
              <button type="button" (click)="confirmWorkerSelection()" [disabled]="selectedWorkers().length === 0"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                Continua ({{ selectedWorkers().length }} {{ selectedWorkers().length === 1 ? 'lucrator' : 'lucratori' }}) &rarr;
              </button>
            </div>
          </div>
        }

        <!-- STEP 2: Voucher data -->
        @if (selectedWorkers().length > 0 && !showWorkerPicker()) {
          <!-- Selected workers summary (editable) -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-foreground">Lucratori selectati ({{ selectedWorkers().length }})</h2>
              <button type="button" (click)="showWorkerPicker.set(true)" class="text-xs font-medium text-primary hover:underline">
                Modifica selectia
              </button>
            </div>

            <div class="space-y-3">
              @for (w of selectedWorkers(); track w.idnp; let i = $index) {
                <div class="flex items-center gap-4 p-3 rounded-md ring-1 ring-foreground/10 bg-muted/30">
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-foreground">{{ w.firstName }} {{ w.lastName }}</div>
                    <div class="text-xs text-muted-foreground font-mono">IDNP: {{ w.idnp }}</div>
                  </div>
                  <div class="w-48">
                    <label class="text-xs text-muted-foreground">Remunerare neta (MDL) *</label>
                    <input type="number" min="1" [value]="w.netRemuneration"
                      (input)="updateRemuneration(i, +$any($event.target).value)"
                      class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                  </div>
                  <div class="w-48 text-xs">
                    <div class="text-muted-foreground">Brut:</div>
                    <div class="font-semibold text-foreground">{{ getWorkerTax(i).gross }} MDL</div>
                  </div>
                  <button type="button" (click)="removeSelected(i)" class="text-xs text-destructive hover:text-destructive/80">Sterge</button>
                </div>
              }
            </div>
          </div>

          <!-- Voucher common details -->
          <form [formGroup]="voucherForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">Pasul 2 — Detalii voucher</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Data lucrului *</label>
                  <input type="date" formControlName="workDate" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Ore lucrate (1-8) *</label>
                  <input type="number" formControlName="hoursWorked" min="1" max="8" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Raion *</label>
                  <select formControlName="workDistrict" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Selectati raionul</option>
                    <option value="Chisinau">Chisinau</option>
                    <option value="Balti">Balti</option>
                    <option value="Cahul">Cahul</option>
                    <option value="Orhei">Orhei</option>
                    <option value="Ungheni">Ungheni</option>
                    <option value="Soroca">Soroca</option>
                    <option value="Edinet">Edinet</option>
                    <option value="Comrat">Comrat</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium leading-none">Localitate *</label>
                  <input type="text" formControlName="workLocality" placeholder="Introduceti localitatea" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div class="md:col-span-2 space-y-2">
                  <label class="text-sm font-medium leading-none">Adresa</label>
                  <input type="text" formControlName="workAddress" placeholder="Optional" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
              </div>

              <div class="mt-4 flex items-center gap-6">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" formControlName="art5Alin1LitB" class="rounded border-input text-primary" />
                  Art. 5, alin. (1), lit. b)
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" formControlName="art5Alin1LitG" class="rounded border-input text-primary" />
                  Art. 5, alin. (1), lit. g)
                </label>
              </div>
            </div>

            <!-- Totals -->
            <div class="bg-primary/10 rounded-xl ring-1 ring-primary/20 p-4">
              <h3 class="text-sm font-semibold text-foreground mb-2">Sumar total</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span class="text-muted-foreground">Lucratori:</span> <strong>{{ selectedWorkers().length }}</strong></div>
                <div><span class="text-muted-foreground">Total net:</span> <strong>{{ totalNet() }} MDL</strong></div>
                <div><span class="text-muted-foreground">Impozit + CNAS:</span> <strong>{{ totalTax() + totalCnas() }} MDL</strong></div>
                <div><span class="text-muted-foreground">Total brut:</span> <strong>{{ totalGross() }} MDL</strong></div>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">{{ errorMessage() }}</div>
            }

            <div class="flex justify-end">
              <button type="submit" [disabled]="submitting()"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (submitting()) { Se proceseaza... } @else { Confirmare si creare vouchere }
              </button>
            </div>
          </form>
        }
      } @else {
        <!-- Success summary -->
        <div class="bg-success/10 rounded-xl ring-1 ring-success/20 p-6">
          <h2 class="text-lg font-semibold text-success mb-4">Vouchere create cu succes!</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div><span class="text-success">Total vouchere:</span> <strong>{{ createdSummary()!.totalVouchers }}</strong></div>
            <div><span class="text-success">Total net:</span> <strong>{{ createdSummary()!.totalNet }} MDL</strong></div>
            <div><span class="text-success">Total impozit:</span> <strong>{{ createdSummary()!.totalTax }} MDL</strong></div>
            <div><span class="text-success">Total brut:</span> <strong>{{ createdSummary()!.totalGross }} MDL</strong></div>
          </div>
          <div class="border-t border-success/20 pt-4">
            <h3 class="text-sm font-medium mb-2">Coduri vouchere:</h3>
            <div class="flex flex-wrap gap-2">
              @for (v of createdSummary()!.vouchers; track v.id) {
                <span class="inline-flex items-center px-3 py-1 bg-card ring-1 ring-success/30 rounded-full text-sm font-mono text-success">{{ v.code }}</span>
              }
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <a routerLink="/vouchers" class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Inapoi la lista</a>
            <button type="button" (click)="createAnother()" class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium">Creeaza alt voucher</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CreateVoucherComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly voucherDataService = inject(VoucherDataService);
  private readonly workerDataService = inject(WorkerDataService);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly createdSummary = signal<VoucherCreatedSummary | null>(null);

  // Worker picker state
  protected readonly mode = signal<'existing' | 'new'>('existing');
  protected readonly searchTerm = signal('');
  protected readonly loadingWorkers = signal(false);
  protected readonly allWorkers = signal<WorkerModel[]>([]);
  protected readonly showWorkerPicker = signal(true);

  // Selected workers (with per-worker netRemuneration)
  protected readonly selectedWorkers = signal<Array<WorkerModel & { netRemuneration: number }>>([]);

  protected readonly filteredWorkers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allWorkers();
    if (!term) return list;
    return list.filter((w) =>
      w.idnp.includes(term) ||
      w.firstName.toLowerCase().includes(term) ||
      w.lastName.toLowerCase().includes(term)
    );
  });

  protected readonly totalNet = computed(() =>
    Math.round(this.selectedWorkers().reduce((sum, w) => sum + (Number(w.netRemuneration) || 0), 0) * 100) / 100
  );
  protected readonly totalTax = computed(() => Math.round(this.totalNet() * 0.12 * 100) / 100);
  protected readonly totalCnas = computed(() => Math.round(this.totalNet() * 0.06 * 100) / 100);
  protected readonly totalGross = computed(() => Math.round((this.totalNet() + this.totalTax() + this.totalCnas()) * 100) / 100);

  // New worker form
  protected readonly newWorkerForm = this.fb.group({
    idnp: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    birthDate: ['', Validators.required],
    phone: [''],
    email: [''],
  });

  // Voucher-specific form (step 2)
  protected readonly voucherForm = this.fb.group({
    workDate: ['', Validators.required],
    hoursWorked: [8, [Validators.required, Validators.min(1), Validators.max(8)]],
    workDistrict: ['', Validators.required],
    workLocality: ['', Validators.required],
    workAddress: [''],
    art5Alin1LitB: [false],
    art5Alin1LitG: [false],
  });

  ngOnInit(): void {
    this.loadWorkers();
  }

  private loadWorkers(): void {
    this.loadingWorkers.set(true);
    this.workerDataService.getWorkers({ offset: 0, limit: 100 }).subscribe({
      next: (result) => {
        this.allWorkers.set(result.items);
        this.loadingWorkers.set(false);
      },
      error: () => this.loadingWorkers.set(false),
    });
  }

  protected isSelected(id: string): boolean {
    return this.selectedWorkers().some((w) => w.id === id);
  }

  protected toggleWorker(w: WorkerModel): void {
    const current = this.selectedWorkers();
    if (current.some((x) => x.id === w.id)) {
      this.selectedWorkers.set(current.filter((x) => x.id !== w.id));
    } else {
      this.selectedWorkers.set([...current, { ...w, netRemuneration: 0 }]);
    }
  }

  protected addNewWorker(): void {
    if (this.newWorkerForm.invalid) {
      this.newWorkerForm.markAllAsTouched();
      return;
    }
    const v = this.newWorkerForm.getRawValue();
    const newWorker: WorkerModel & { netRemuneration: number } = {
      id: `new-${v.idnp}`,
      idnp: v.idnp!,
      firstName: v.firstName!,
      lastName: v.lastName!,
      birthDate: v.birthDate!,
      phone: v.phone || undefined,
      email: v.email || undefined,
      rspValidated: false,
      netRemuneration: 0,
    };
    this.selectedWorkers.set([...this.selectedWorkers(), newWorker]);
    this.newWorkerForm.reset();
    this.mode.set('existing');
  }

  protected confirmWorkerSelection(): void {
    this.showWorkerPicker.set(false);
  }

  protected updateRemuneration(index: number, value: number): void {
    const list = [...this.selectedWorkers()];
    list[index] = { ...list[index], netRemuneration: value };
    this.selectedWorkers.set(list);
  }

  protected removeSelected(index: number): void {
    const list = [...this.selectedWorkers()];
    list.splice(index, 1);
    this.selectedWorkers.set(list);
    if (list.length === 0) this.showWorkerPicker.set(true);
  }

  protected getWorkerTax(index: number): WorkerTax {
    const net = Number(this.selectedWorkers()[index]?.netRemuneration) || 0;
    const tax = Math.round(net * 0.12 * 100) / 100;
    const cnas = Math.round(net * 0.06 * 100) / 100;
    return { net, tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 };
  }

  protected onSubmit(): void {
    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      this.errorMessage.set('Completati toate campurile obligatorii.');
      return;
    }

    if (this.selectedWorkers().some((w) => !w.netRemuneration || w.netRemuneration < 1)) {
      this.errorMessage.set('Completati remunerarea neta pentru toti lucratorii.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const v = this.voucherForm.getRawValue();
    const request = {
      workDate: v.workDate!,
      hoursWorked: v.hoursWorked!,
      workDistrict: v.workDistrict!,
      workLocality: v.workLocality!,
      workAddress: v.workAddress || undefined,
      art5Alin1LitB: v.art5Alin1LitB ?? false,
      art5Alin1LitG: v.art5Alin1LitG ?? false,
      workers: this.selectedWorkers().map((w) => ({
        idnp: w.idnp,
        firstName: w.firstName,
        lastName: w.lastName,
        birthDate: w.birthDate,
        netRemuneration: Number(w.netRemuneration),
        phone: w.phone || undefined,
        email: w.email || undefined,
      })),
    };

    this.voucherDataService.createVouchers(request).subscribe({
      next: (summary) => {
        this.createdSummary.set(summary);
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Eroare la crearea voucherelor.');
      },
    });
  }

  protected createAnother(): void {
    this.createdSummary.set(null);
    this.selectedWorkers.set([]);
    this.showWorkerPicker.set(true);
    this.mode.set('existing');
    this.searchTerm.set('');
    this.voucherForm.reset({ hoursWorked: 8, art5Alin1LitB: false, art5Alin1LitG: false });
    this.newWorkerForm.reset();
    this.loadWorkers();
  }
}
