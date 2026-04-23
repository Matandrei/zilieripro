import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { WorkerDataService } from '../../workers/data/worker-data.service';
import { VoucherCreatedSummary, WorkerModel } from '../../../shared/models/voucher.model';

interface VoucherWorkerRow {
  id: string; // local uid or worker id
  workerId?: string; // if existing
  idnp: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  phone?: string;
  email?: string;
  rspValidated: boolean;
  netRemuneration: number;
  hoursWorked: number;
}

@Component({
  selector: 'app-create-voucher',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Inapoi la lista</a>
        <h1 class="text-3xl font-bold tracking-tight text-foreground mt-2">Creare voucher nou</h1>
      </div>

      @if (!createdSummary()) {
        <!-- =========== SECTIUNEA 1: CAMPURI OBLIGATORII =========== -->
        <form [formGroup]="voucherForm" class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-foreground">Campuri obligatorii</h2>
            <p class="text-sm text-muted-foreground mt-1">
              Necesare pentru crearea voucherului cu statut
              <span class="font-semibold text-foreground">EMIS</span>
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Data lucrarilor <span class="text-destructive">*</span></label>
              <input type="date" formControlName="workDate"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Nr. ore de munca predefinit <span class="text-destructive">*</span></label>
              <input type="number" formControlName="defaultHours" min="1" max="8"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Raion <span class="text-destructive">*</span></label>
              <select formControlName="workDistrict"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
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
              <label class="text-sm font-medium leading-none">Localitate <span class="text-destructive">*</span></label>
              <input type="text" formControlName="workLocality" placeholder="Introduceti localitatea"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>

            <div class="space-y-2 md:col-span-2 lg:col-span-4">
              <label class="text-sm font-medium leading-none">Adresa <span class="text-destructive">*</span></label>
              <input type="text" formControlName="workAddress" placeholder="str. Exemplu 1/2"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
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
        </form>

        <!-- =========== SECTIUNEA 2: LUCRATORI =========== -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-foreground">Lucratori</h2>
            <p class="text-sm text-muted-foreground mt-1">Adaugati zilierii pentru care se emit vouchere. Datele se valideaza prin RSP la creare.</p>
          </div>

          <!-- Three-button selector -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button type="button" (click)="openPanel('new')"
              [class]="'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-semibold transition-colors ' + (panel() === 'new' ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Lucrator nou
            </button>

            <button type="button" (click)="openPanel('existing')"
              [class]="'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-semibold transition-colors ' + (panel() === 'existing' ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Din lista existenta
            </button>

            <button type="button" (click)="openPanel('csv')"
              [class]="'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-semibold transition-colors ' + (panel() === 'csv' ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import IDNP (CSV)
            </button>
          </div>

          <!-- RSP info banner -->
          <div class="mb-4 flex items-start gap-3 rounded-md bg-primary/5 ring-1 ring-primary/20 p-3 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 text-primary flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            <div>
              <span class="font-semibold text-foreground">Verificare RSP:</span>
              <span class="text-muted-foreground"> La salvare, datele se valideaza prin RSP (MConnect). Campurile eronate vor fi marcate.</span>
            </div>
          </div>

          <!-- INLINE PANEL: NEW WORKER -->
          @if (panel() === 'new') {
            <div class="mb-4 rounded-md ring-1 ring-foreground/10 p-4 bg-muted/20">
              <h3 class="text-sm font-semibold mb-3">Adauga lucrator nou</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3" [formGroup]="newWorkerForm">
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">IDNP *</label>
                  <input type="text" formControlName="idnp" maxlength="13" placeholder="13 cifre"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Prenume *</label>
                  <input type="text" formControlName="firstName"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Nume *</label>
                  <input type="text" formControlName="lastName"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Patronimic</label>
                  <input type="text" formControlName="middleName"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Data nasterii *</label>
                  <input type="date" formControlName="birthDate"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Remunerare neta (MDL) *</label>
                  <input type="number" formControlName="netRemuneration" min="1"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Telefon</label>
                  <input type="tel" formControlName="phone" placeholder="+373 ..."
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5 md:col-span-2">
                  <label class="text-xs text-muted-foreground">Email</label>
                  <input type="email" formControlName="email" placeholder="nume@exemplu.md"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-3">
                <button type="button" (click)="panel.set(null)"
                  class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">Anuleaza</button>
                <button type="button" (click)="addNewWorker()" [disabled]="newWorkerForm.invalid"
                  class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                  + Adauga in voucher
                </button>
              </div>
            </div>
          }

          <!-- INLINE PANEL: FROM EXISTING LIST -->
          @if (panel() === 'existing') {
            <div class="mb-4 rounded-md ring-1 ring-foreground/10 p-4 bg-muted/20">
              <h3 class="text-sm font-semibold mb-3">Selectati lucratori din registrul RSP</h3>
              <div class="relative mb-3">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)"
                  placeholder="Cauta dupa IDNP, nume, prenume..."
                  class="flex h-9 w-full rounded-md border border-input bg-white pl-9 pr-3 py-1 text-sm" />
              </div>
              <div class="max-h-80 overflow-auto rounded-md ring-1 ring-foreground/10 bg-white">
                @if (loadingWorkers()) {
                  <div class="p-6 text-center text-sm text-muted-foreground">Se incarca...</div>
                } @else if (filteredAvailableWorkers().length === 0) {
                  <div class="p-6 text-center text-sm text-muted-foreground">Nu au fost gasiti lucratori.</div>
                } @else {
                  <table class="w-full text-sm">
                    <tbody>
                      @for (w of filteredAvailableWorkers(); track w.id) {
                        <tr class="border-t border-foreground/10 hover:bg-muted/30 cursor-pointer first:border-t-0" (click)="addFromExisting(w)">
                          <td class="p-3">
                            <div class="font-medium">{{ w.firstName }} {{ w.lastName }}</div>
                            <div class="text-xs text-muted-foreground font-mono">{{ w.idnp }}</div>
                          </td>
                          <td class="p-3 text-right">
                            @if (w.rspValidated) {
                              <span class="inline-flex items-center gap-1 text-xs text-green-600"><span class="size-1.5 rounded-full bg-green-500"></span>RSP validat</span>
                            }
                          </td>
                          <td class="p-3 w-24 text-right">
                            <span class="inline-flex items-center gap-1 text-sm font-medium text-primary">+ Adauga</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
              <div class="flex justify-end mt-3">
                <button type="button" (click)="panel.set(null)"
                  class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">Inchide</button>
              </div>
            </div>
          }

          <!-- INLINE PANEL: CSV IMPORT -->
          @if (panel() === 'csv') {
            <div class="mb-4 rounded-md ring-1 ring-foreground/10 p-4 bg-muted/20">
              <h3 class="text-sm font-semibold mb-2">Import lucratori prin CSV</h3>
              <p class="text-xs text-muted-foreground mb-3">Fiecare linie trebuie sa contina: <span class="font-mono">IDNP,Prenume,Nume,DataNasterii(YYYY-MM-DD),RemunerareNeta</span></p>
              <textarea rows="6" [value]="csvText()" (input)="csvText.set($any($event.target).value)"
                placeholder="2001234567890,Ion,Popescu,1985-04-15,250&#10;2009876543210,Maria,Codreanu,1990-06-20,300"
                class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-mono"></textarea>
              <div class="flex justify-end gap-2 mt-3">
                <button type="button" (click)="panel.set(null)"
                  class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">Anuleaza</button>
                <button type="button" (click)="importCsv()"
                  class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">
                  Importa
                </button>
              </div>
              @if (csvError()) {
                <div class="mt-2 text-xs text-destructive">{{ csvError() }}</div>
              }
            </div>
          }

          <!-- WORKER CARDS -->
          @if (rows().length === 0) {
            <div class="rounded-md border border-dashed border-foreground/20 p-8 text-center text-sm text-muted-foreground">
              Nu au fost adaugati lucratori. Folositi butoanele de mai sus.
            </div>
          } @else {
            <div class="space-y-3">
              @for (row of rows(); track row.id; let i = $index) {
                <div class="rounded-md ring-1 ring-foreground/10 bg-white overflow-hidden border-l-4 border-l-green-500">
                  <!-- Header -->
                  <div class="flex items-center gap-3 px-4 py-3 bg-muted/20">
                    <div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {{ initials(row) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <div class="font-semibold text-foreground">{{ row.lastName }} {{ row.firstName }} @if (row.middleName) {{{ row.middleName }}}</div>
                        @if (row.rspValidated) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 text-green-500" title="RSP validat"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                        }
                      </div>
                      <div class="text-xs text-muted-foreground">IDNP: {{ row.idnp }} · Nas.: {{ formatDate(row.birthDate) }}</div>
                    </div>
                    <div class="flex items-center gap-1">
                      <button type="button" (click)="editRow(i)" class="size-8 inline-flex items-center justify-center rounded-md hover:bg-accent" title="Editeaza">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button type="button" (click)="removeRow(i)" class="size-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive" title="Sterge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Edit mode -->
                  @if (editingIndex() === i) {
                    <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Remunerare neta (MDL) *</label>
                        <input type="number" min="1" [value]="row.netRemuneration" (input)="updateRow(i, 'netRemuneration', +$any($event.target).value)"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Ore de munca *</label>
                        <input type="number" min="1" max="8" [value]="row.hoursWorked" (input)="updateRow(i, 'hoursWorked', +$any($event.target).value)"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Telefon</label>
                        <input type="tel" [value]="row.phone || ''" (input)="updateRow(i, 'phone', $any($event.target).value)"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Email</label>
                        <input type="email" [value]="row.email || ''" (input)="updateRow(i, 'email', $any($event.target).value)"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="md:col-span-4 flex justify-end">
                        <button type="button" (click)="editingIndex.set(null)" class="text-xs font-medium text-primary hover:underline">Gata</button>
                      </div>
                    </div>
                  } @else {
                    <!-- View mode: tax breakdown grid -->
                    <div class="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 text-sm">
                      <div>
                        <div class="text-xs text-muted-foreground">Remuneratie neta</div>
                        <div class="font-semibold text-foreground">{{ row.netRemuneration }} MDL</div>
                      </div>
                      <div>
                        <div class="text-xs text-muted-foreground">Impozit pe venit (12%)</div>
                        <div class="font-semibold text-foreground">{{ taxOf(row).tax }} MDL</div>
                      </div>
                      <div>
                        <div class="text-xs text-muted-foreground">Contributii CNAS (6%)</div>
                        <div class="font-semibold text-foreground">{{ taxOf(row).cnas }} MDL</div>
                      </div>
                      <div>
                        <div class="text-xs text-muted-foreground">Remuneratie bruta</div>
                        <div class="font-semibold text-primary">{{ taxOf(row).gross }} MDL</div>
                      </div>
                      <div>
                        <div class="text-xs text-muted-foreground">Ore de munca</div>
                        <div class="font-semibold text-foreground">{{ row.hoursWorked }} ore</div>
                      </div>
                      <div>
                        <div class="text-xs text-muted-foreground">Telefon</div>
                        <div class="font-semibold text-foreground">{{ row.phone || '—' }}</div>
                      </div>
                      @if (row.email) {
                        <div class="md:col-span-6">
                          <div class="text-xs text-muted-foreground">Email</div>
                          <div class="font-semibold text-foreground">{{ row.email }}</div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- TOTALS + SUBMIT -->
        @if (rows().length > 0) {
          <div class="bg-primary/10 rounded-xl ring-1 ring-primary/20 p-4 mb-4">
            <h3 class="text-sm font-semibold text-foreground mb-2">Sumar total</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span class="text-muted-foreground">Vouchere:</span> <strong>{{ rows().length }}</strong></div>
              <div><span class="text-muted-foreground">Total net:</span> <strong>{{ totalNet() }} MDL</strong></div>
              <div><span class="text-muted-foreground">Impozit + CNAS:</span> <strong>{{ totalTax() + totalCnas() }} MDL</strong></div>
              <div><span class="text-muted-foreground">Total brut:</span> <strong>{{ totalGross() }} MDL</strong></div>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">{{ errorMessage() }}</div>
        }

        <div class="flex justify-end gap-2">
          <a routerLink="/vouchers" class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium">Anuleaza</a>
          <button type="button" (click)="onSubmit()" [disabled]="submitting() || rows().length === 0"
            class="inline-flex h-10 items-center justify-center rounded-md bg-primary text-primary-foreground px-6 text-sm font-semibold disabled:opacity-50">
            @if (submitting()) { Se proceseaza... } @else { Confirmare si creare vouchere }
          </button>
        </div>
      } @else {
        <!-- SUCCESS -->
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

  // Workers data (all from registry)
  protected readonly loadingWorkers = signal(false);
  protected readonly allWorkers = signal<WorkerModel[]>([]);
  protected readonly searchTerm = signal('');

  // Panel state: which add-option is active
  protected readonly panel = signal<null | 'new' | 'existing' | 'csv'>(null);

  // CSV import state
  protected readonly csvText = signal('');
  protected readonly csvError = signal('');

  // Added worker rows (what will be submitted)
  protected readonly rows = signal<VoucherWorkerRow[]>([]);
  protected readonly editingIndex = signal<number | null>(null);

  protected readonly filteredAvailableWorkers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const addedIdnps = new Set(this.rows().map((r) => r.idnp));
    const list = this.allWorkers().filter((w) => !addedIdnps.has(w.idnp));
    if (!term) return list;
    return list.filter((w) =>
      w.idnp.includes(term) ||
      w.firstName.toLowerCase().includes(term) ||
      w.lastName.toLowerCase().includes(term)
    );
  });

  protected readonly totalNet = computed(() =>
    Math.round(this.rows().reduce((sum, r) => sum + (Number(r.netRemuneration) || 0), 0) * 100) / 100
  );
  protected readonly totalTax = computed(() => Math.round(this.totalNet() * 0.12 * 100) / 100);
  protected readonly totalCnas = computed(() => Math.round(this.totalNet() * 0.06 * 100) / 100);
  protected readonly totalGross = computed(() => Math.round((this.totalNet() + this.totalTax() + this.totalCnas()) * 100) / 100);

  protected readonly voucherForm = this.fb.group({
    workDate: [new Date().toISOString().split('T')[0], Validators.required],
    defaultHours: [8, [Validators.required, Validators.min(1), Validators.max(8)]],
    workDistrict: ['', Validators.required],
    workLocality: ['', Validators.required],
    workAddress: ['', Validators.required],
    art5Alin1LitB: [false],
    art5Alin1LitG: [false],
  });

  protected readonly newWorkerForm = this.fb.group({
    idnp: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    middleName: [''],
    birthDate: ['', Validators.required],
    netRemuneration: [0, [Validators.required, Validators.min(1)]],
    phone: [''],
    email: [''],
  });

  ngOnInit(): void {
    this.workerDataService.getWorkers({ offset: 0, limit: 200 }).subscribe({
      next: (r) => this.allWorkers.set(r.items),
    });
  }

  protected openPanel(p: 'new' | 'existing' | 'csv'): void {
    this.panel.set(this.panel() === p ? null : p);
    if (p === 'existing') this.searchTerm.set('');
    if (p === 'new') this.newWorkerForm.reset({ netRemuneration: 0 });
    if (p === 'csv') {
      this.csvText.set('');
      this.csvError.set('');
    }
  }

  protected addNewWorker(): void {
    if (this.newWorkerForm.invalid) {
      this.newWorkerForm.markAllAsTouched();
      return;
    }
    const v = this.newWorkerForm.getRawValue();
    this.rows.update((list) => [...list, {
      id: `new-${v.idnp}-${Date.now()}`,
      idnp: v.idnp!,
      firstName: v.firstName!,
      lastName: v.lastName!,
      middleName: v.middleName || undefined,
      birthDate: v.birthDate!,
      netRemuneration: Number(v.netRemuneration) || 0,
      hoursWorked: this.voucherForm.value.defaultHours || 8,
      phone: v.phone || undefined,
      email: v.email || undefined,
      rspValidated: false,
    }]);
    this.newWorkerForm.reset({ netRemuneration: 0 });
    this.panel.set(null);
  }

  protected addFromExisting(w: WorkerModel): void {
    if (this.rows().some((r) => r.idnp === w.idnp)) return;
    this.rows.update((list) => [...list, {
      id: w.id,
      workerId: w.id,
      idnp: w.idnp,
      firstName: w.firstName,
      lastName: w.lastName,
      birthDate: w.birthDate,
      phone: w.phone,
      email: w.email,
      rspValidated: w.rspValidated,
      netRemuneration: 0,
      hoursWorked: this.voucherForm.value.defaultHours || 8,
    }]);
    // Open edit mode so user sets remuneration
    this.editingIndex.set(this.rows().length - 1);
  }

  protected importCsv(): void {
    this.csvError.set('');
    const lines = this.csvText().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      this.csvError.set('Nu exista date de importat.');
      return;
    }
    const newRows: VoucherWorkerRow[] = [];
    const existing = new Set(this.rows().map((r) => r.idnp));
    for (let idx = 0; idx < lines.length; idx++) {
      const parts = lines[idx].split(',').map((x) => x.trim());
      if (parts.length < 5) {
        this.csvError.set(`Linia ${idx + 1}: format invalid (asteptat IDNP,Prenume,Nume,DataNasterii,Remunerare)`);
        return;
      }
      const [idnp, firstName, lastName, birthDate, net] = parts;
      if (idnp.length !== 13) {
        this.csvError.set(`Linia ${idx + 1}: IDNP trebuie sa fie exact 13 cifre.`);
        return;
      }
      if (existing.has(idnp)) continue;
      existing.add(idnp);
      newRows.push({
        id: `csv-${idnp}-${Date.now()}-${idx}`,
        idnp,
        firstName,
        lastName,
        birthDate,
        netRemuneration: Number(net) || 0,
        hoursWorked: this.voucherForm.value.defaultHours || 8,
        rspValidated: false,
      });
    }
    this.rows.update((list) => [...list, ...newRows]);
    this.panel.set(null);
    this.csvText.set('');
  }

  protected editRow(i: number): void {
    this.editingIndex.set(this.editingIndex() === i ? null : i);
  }

  protected updateRow(i: number, key: keyof VoucherWorkerRow, value: any): void {
    this.rows.update((list) => {
      const copy = [...list];
      copy[i] = { ...copy[i], [key]: value };
      return copy;
    });
  }

  protected removeRow(i: number): void {
    this.rows.update((list) => list.filter((_, idx) => idx !== i));
    if (this.editingIndex() === i) this.editingIndex.set(null);
  }

  protected taxOf(row: VoucherWorkerRow) {
    const net = Number(row.netRemuneration) || 0;
    const tax = Math.round(net * 0.12 * 100) / 100;
    const cnas = Math.round(net * 0.06 * 100) / 100;
    return { tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 };
  }

  protected initials(row: VoucherWorkerRow): string {
    return `${(row.firstName?.[0] || '').toUpperCase()}${(row.lastName?.[0] || '').toUpperCase()}` || '?';
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  protected onSubmit(): void {
    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      this.errorMessage.set('Completati toate campurile obligatorii.');
      return;
    }
    if (this.rows().length === 0) {
      this.errorMessage.set('Adaugati cel putin un lucrator.');
      return;
    }
    if (this.rows().some((r) => !r.netRemuneration || r.netRemuneration < 1)) {
      this.errorMessage.set('Completati remunerarea neta pentru toti lucratorii.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const v = this.voucherForm.getRawValue();
    // Backend expects a single hoursWorked on the voucher, so use per-row if different would require API change.
    // For now use defaultHours from form (which also drives new rows).
    const request = {
      workDate: v.workDate!,
      hoursWorked: v.defaultHours!,
      workDistrict: v.workDistrict!,
      workLocality: v.workLocality!,
      workAddress: v.workAddress || undefined,
      art5Alin1LitB: v.art5Alin1LitB ?? false,
      art5Alin1LitG: v.art5Alin1LitG ?? false,
      workers: this.rows().map((r) => ({
        idnp: r.idnp,
        firstName: r.firstName,
        lastName: r.lastName,
        birthDate: r.birthDate,
        netRemuneration: Number(r.netRemuneration),
        phone: r.phone || undefined,
        email: r.email || undefined,
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
    this.rows.set([]);
    this.editingIndex.set(null);
    this.panel.set(null);
    this.voucherForm.reset({
      workDate: new Date().toISOString().split('T')[0],
      defaultHours: 8,
      art5Alin1LitB: false,
      art5Alin1LitG: false,
    });
  }
}
