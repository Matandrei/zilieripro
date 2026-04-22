import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherCreatedSummary } from '../../../shared/models/voucher.model';

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
      </div>

      @if (!createdSummary()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Work details -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Detalii munca</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Data lucrului</label>
                <input
                  type="date"
                  formControlName="workDate"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Ore lucrate (1-8)</label>
                <input
                  type="number"
                  formControlName="hoursWorked"
                  min="1"
                  max="8"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Raion</label>
                <select
                  formControlName="workDistrict"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
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
                <label class="text-sm font-medium leading-none select-none">Localitate</label>
                <input
                  type="text"
                  formControlName="workLocality"
                  placeholder="Introduceti localitatea"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-sm font-medium leading-none select-none">Adresa</label>
                <input
                  type="text"
                  formControlName="workAddress"
                  placeholder="Introduceti adresa (optional)"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </div>

            <!-- Art. 5 checkboxes -->
            <div class="mt-4 flex items-center gap-6">
              <label class="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" formControlName="art5Alin1LitB" class="rounded border-input text-primary focus:ring-ring/50" />
                Art. 5, alin. (1), lit. b)
              </label>
              <label class="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" formControlName="art5Alin1LitG" class="rounded border-input text-primary focus:ring-ring/50" />
                Art. 5, alin. (1), lit. g)
              </label>
            </div>
          </div>

          <!-- Workers -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-foreground">Lucratori</h2>
              <button
                type="button"
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                (click)="addWorker()"
              >
                + Adaugare lucrator
              </button>
            </div>

            @for (worker of workersArray.controls; track $index; let i = $index) {
              <div class="ring-1 ring-foreground/10 rounded-xl p-4 mb-4" [formGroupName]="'workers'">
                <div [formGroupName]="i">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium leading-none select-none">Lucrator {{ i + 1 }}</h3>
                    @if (workersArray.length > 1) {
                      <button
                        type="button"
                        class="text-xs text-destructive hover:text-destructive/80"
                        (click)="removeWorker(i)"
                      >
                        Sterge
                      </button>
                    }
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">IDNP</label>
                      <input
                        type="text"
                        formControlName="idnp"
                        maxlength="13"
                        placeholder="13 cifre"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">Prenume</label>
                      <input
                        type="text"
                        formControlName="firstName"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">Nume</label>
                      <input
                        type="text"
                        formControlName="lastName"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">Data nasterii</label>
                      <input
                        type="date"
                        formControlName="birthDate"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">Remunerare neta (MDL)</label>
                      <input
                        type="number"
                        formControlName="netRemuneration"
                        min="0"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">Telefon</label>
                      <input
                        type="tel"
                        formControlName="phone"
                        placeholder="Optional"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium leading-none select-none">Email</label>
                      <input
                        type="email"
                        formControlName="email"
                        placeholder="Optional"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                  </div>

                  <!-- Tax calculation -->
                  <div class="mt-3 bg-muted rounded-md p-3">
                    <div class="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Net: <strong class="text-foreground">{{ getWorkerTax(i).net }} MDL</strong></span>
                      <span>&rarr;</span>
                      <span>+12% impozit: <strong class="text-foreground">{{ getWorkerTax(i).tax }} MDL</strong></span>
                      <span>&rarr;</span>
                      <span>+6% CNAS: <strong class="text-foreground">{{ getWorkerTax(i).cnas }} MDL</strong></span>
                      <span>&rarr;</span>
                      <span>Brut: <strong class="text-primary">{{ getWorkerTax(i).gross }} MDL</strong></span>
                    </div>
                  </div>

                  <!-- Worker-specific errors -->
                  @if (workerErrors()[i]) {
                    <div class="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
                      <p class="text-xs">{{ workerErrors()[i] }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Totals -->
          <div class="bg-primary/10 rounded-xl ring-1 ring-primary/20 p-4">
            <h3 class="text-sm font-semibold text-foreground mb-2">Sumar total</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Lucratori:</span>
                <strong class="ml-1 text-foreground">{{ workersArray.length }}</strong>
              </div>
              <div>
                <span class="text-muted-foreground">Total net:</span>
                <strong class="ml-1 text-foreground">{{ totalNet() }} MDL</strong>
              </div>
              <div>
                <span class="text-muted-foreground">Total impozit + CNAS:</span>
                <strong class="ml-1 text-foreground">{{ totalTax() + totalCnas() }} MDL</strong>
              </div>
              <div>
                <span class="text-muted-foreground">Total brut:</span>
                <strong class="ml-1 text-foreground">{{ totalGross() }} MDL</strong>
              </div>
            </div>
          </div>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit -->
          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="submitting()"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              @if (submitting()) {
                Se proceseaza...
              } @else {
                Confirmare si creare vouchere
              }
            </button>
          </div>
        </form>
      } @else {
        <!-- Success summary -->
        <div class="bg-success/10 rounded-xl ring-1 ring-success/20 p-6">
          <h2 class="text-lg font-semibold text-success mb-4">Vouchere create cu succes!</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <span class="text-success">Total vouchere:</span>
              <strong class="ml-1 text-foreground">{{ createdSummary()!.totalVouchers }}</strong>
            </div>
            <div>
              <span class="text-success">Total net:</span>
              <strong class="ml-1 text-foreground">{{ createdSummary()!.totalNet }} MDL</strong>
            </div>
            <div>
              <span class="text-success">Total impozit:</span>
              <strong class="ml-1 text-foreground">{{ createdSummary()!.totalTax }} MDL</strong>
            </div>
            <div>
              <span class="text-success">Total brut:</span>
              <strong class="ml-1 text-foreground">{{ createdSummary()!.totalGross }} MDL</strong>
            </div>
          </div>
          <div class="border-t border-success/20 pt-4">
            <h3 class="text-sm font-medium text-foreground mb-2">Coduri vouchere:</h3>
            <div class="flex flex-wrap gap-2">
              @for (v of createdSummary()!.vouchers; track v.id) {
                <span class="inline-flex items-center px-3 py-1 bg-card ring-1 ring-success/30 rounded-full text-sm font-mono text-success">
                  {{ v.code }}
                </span>
              }
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <a
              routerLink="/vouchers"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
            >
              Inapoi la lista
            </a>
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
              (click)="createAnother()"
            >
              Creeaza alt voucher
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CreateVoucherComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly voucherDataService = inject(VoucherDataService);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly workerErrors = signal<Record<number, string>>({});
  protected readonly createdSummary = signal<VoucherCreatedSummary | null>(null);

  protected readonly form = this.fb.group({
    workDate: ['', Validators.required],
    hoursWorked: [8, [Validators.required, Validators.min(1), Validators.max(8)]],
    workDistrict: ['', Validators.required],
    workLocality: ['', Validators.required],
    workAddress: [''],
    art5Alin1LitB: [false],
    art5Alin1LitG: [false],
    workers: this.fb.array([this.createWorkerGroup()]),
  });

  get workersArray(): FormArray {
    return this.form.get('workers') as FormArray;
  }

  protected totalNet = signal(0);
  protected totalTax = signal(0);
  protected totalCnas = signal(0);
  protected totalGross = signal(0);

  constructor() {
    this.workersArray.valueChanges.subscribe(() => this.recalculateTotals());
  }

  protected addWorker(): void {
    this.workersArray.push(this.createWorkerGroup());
  }

  protected removeWorker(index: number): void {
    this.workersArray.removeAt(index);
    this.recalculateTotals();
  }

  protected getWorkerTax(index: number): WorkerTax {
    const net = Number(this.workersArray.at(index).get('netRemuneration')?.value) || 0;
    const tax = Math.round(net * 0.12 * 100) / 100;
    const cnas = Math.round(net * 0.06 * 100) / 100;
    return { net, tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 };
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completati toate campurile obligatorii.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.workerErrors.set({});

    const value = this.form.getRawValue();
    const request = {
      workDate: value.workDate!,
      hoursWorked: value.hoursWorked!,
      workDistrict: value.workDistrict!,
      workLocality: value.workLocality!,
      workAddress: value.workAddress || undefined,
      art5Alin1LitB: value.art5Alin1LitB ?? false,
      art5Alin1LitG: value.art5Alin1LitG ?? false,
      workers: value.workers!.map((w: any) => ({
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
        if (err.error?.workerErrors) {
          const errors: Record<number, string> = {};
          Object.entries(err.error.workerErrors).forEach(([idx, msg]) => {
            errors[Number(idx)] = msg as string;
          });
          this.workerErrors.set(errors);
          this.errorMessage.set('Erori de validare RSP. Verificati lucratorii marcati.');
        } else {
          this.errorMessage.set(err.error?.message || 'Eroare la crearea voucherelor.');
        }
      },
    });
  }

  protected createAnother(): void {
    this.createdSummary.set(null);
    this.form.reset({
      hoursWorked: 8,
      art5Alin1LitB: false,
      art5Alin1LitG: false,
    });
    this.workersArray.clear();
    this.workersArray.push(this.createWorkerGroup());
  }

  private createWorkerGroup(): FormGroup {
    return this.fb.group({
      idnp: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
      netRemuneration: [0, [Validators.required, Validators.min(1)]],
      phone: [''],
      email: [''],
    });
  }

  private recalculateTotals(): void {
    let net = 0, tax = 0, cnas = 0, gross = 0;
    for (let i = 0; i < this.workersArray.length; i++) {
      const wt = this.getWorkerTax(i);
      net += wt.net;
      tax += wt.tax;
      cnas += wt.cnas;
      gross += wt.gross;
    }
    this.totalNet.set(Math.round(net * 100) / 100);
    this.totalTax.set(Math.round(tax * 100) / 100);
    this.totalCnas.set(Math.round(cnas * 100) / 100);
    this.totalGross.set(Math.round(gross * 100) / 100);
  }
}
