import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';
import { WorkerDataService } from '../data/worker-data.service';
import { PaginatedResult, VoucherTableItem, WorkerModel } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';

@Component({
  selector: 'app-beneficiary-lookup',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TranslatePipe, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">{{ 'beneficiary.lookup.title' | t }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ 'beneficiary.lookup.subtitle' | t }}</p>
      </div>

      <!-- Search card -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2 space-y-2">
            <label class="text-sm font-medium leading-none select-none">{{ 'beneficiary.lookup.searchBy' | t }}</label>
            <input
              type="text"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [placeholder]="'beneficiary.lookup.placeholder' | t"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              (keyup.enter)="onSearch()"
            />
          </div>
          <div class="flex items-end gap-2">
            <button type="button" (click)="onSearch()" [disabled]="!searchTerm().trim() || loading()"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-semibold shadow-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              {{ 'beneficiary.lookup.search' | t }}
            </button>
            @if (searched()) {
              <button type="button" (click)="reset()"
                class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
                {{ 'beneficiary.lookup.reset' | t }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="text-sm text-muted-foreground">{{ 'common.loading' | t }}</div>
        </div>
      }

      <!-- Initial hint -->
      @if (!loading() && !searched()) {
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-10 text-center text-sm text-muted-foreground">
          {{ 'beneficiary.lookup.prompt' | t }}
        </div>
      }

      <!-- No results -->
      @if (!loading() && searched() && results().length === 0) {
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-10 text-center text-sm text-muted-foreground">
          {{ 'beneficiary.lookup.noResults' | t }}
        </div>
      }

      <!-- Multiple results: pick one -->
      @if (!loading() && !selected() && results().length > 1) {
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">{{ 'beneficiary.lookup.results' | t }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.idnp' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.lastName' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.firstName' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.phone' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.email' | t }}</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (w of results(); track w.id) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors cursor-pointer" (click)="selectWorker(w)">
                    <td class="p-2 align-middle whitespace-nowrap font-mono">{{ w.idnp | maskIdnp }}</td>
                    <td class="p-2 align-middle whitespace-nowrap">
                      <span class="text-primary hover:underline underline-offset-4 font-medium">{{ w.lastName }}</span>
                    </td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ w.firstName }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ w.phone || '-' }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ w.email || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Selected beneficiary: card + vouchers -->
      @if (selected(); as w) {
        @if (results().length > 1) {
          <div class="mb-4">
            <button type="button" (click)="selected.set(null)"
              class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              {{ 'beneficiary.lookup.backToResults' | t }}
            </button>
          </div>
        }

        <!-- Beneficiary details card -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <div class="flex flex-wrap items-center gap-3 mb-6">
            <h2 class="text-2xl font-bold tracking-tight text-foreground">{{ w.lastName }} {{ w.firstName }}</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'field.idnp' | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground font-mono">{{ w.idnp | maskIdnp }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'field.lastName' | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.lastName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'field.firstName' | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.firstName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'field.birthDate' | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.birthDate }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'field.phone' | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.phone || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'field.email' | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ 'worker.profile.rspValidated' | t }}</dt>
              <dd class="mt-1 text-sm">
                @if (w.rspValidated) {
                  <span class="inline-flex items-center gap-1 text-success">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ 'common.yes' | t }}
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 text-destructive">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {{ 'common.no' | t }}
                  </span>
                }
              </dd>
            </div>
            @if (w.voucherCount !== undefined) {
              <div>
                <dt class="text-sm text-muted-foreground">{{ 'worker.profile.vouchersCount' | t }}</dt>
                <dd class="mt-1 text-sm font-medium text-foreground">{{ w.voucherCount }}</dd>
              </div>
            }
          </div>
        </div>

        <!-- Vouchers section -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">{{ 'beneficiary.lookup.vouchers' | t }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.code' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'beneficiary.lookup.company' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'common.status' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'common.date' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.hours' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.remunerationNet' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.district' | t }}</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (voucher of vouchers(); track voucher.id) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="p-2 align-middle whitespace-nowrap">
                      <a [routerLink]="['/vouchers', voucher.id]" class="text-primary hover:underline underline-offset-4 font-medium">
                        {{ voucher.code }}
                      </a>
                    </td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.beneficiaryName || '-' }}</td>
                    <td class="p-2 align-middle whitespace-nowrap"><app-status-badge [status]="voucher.status" /></td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDate }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.hoursWorked }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.netRemuneration }} MDL</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDistrict }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-2 align-middle py-8 text-center text-sm text-muted-foreground">
                      {{ 'common.noResults' | t }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class BeneficiaryLookupComponent {
  private readonly workerDataService = inject(WorkerDataService);

  protected readonly searchTerm = signal('');

  protected readonly results = signal<WorkerModel[]>([]);
  protected readonly selected = signal<WorkerModel | null>(null);
  protected readonly vouchers = signal<VoucherTableItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly searched = signal(false);

  protected onSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;

    this.loading.set(true);
    this.searched.set(true);
    this.selected.set(null);
    this.vouchers.set([]);
    this.results.set([]);

    this.workerDataService.getWorkers({ contact: term, limit: 50 }).subscribe({
      next: (result: PaginatedResult<WorkerModel>) => {
        this.results.set(result.items);
        this.loading.set(false);
        if (result.items.length === 1) {
          this.selectWorker(result.items[0]);
        }
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }

  protected selectWorker(worker: WorkerModel): void {
    this.selected.set(worker);
    this.vouchers.set([]);
    this.workerDataService.getWorkerVouchersByIdnp(worker.idnp).subscribe({
      next: (result) => this.vouchers.set(result.items),
    });
  }

  protected reset(): void {
    this.searchTerm.set('');
    this.results.set([]);
    this.selected.set(null);
    this.vouchers.set([]);
    this.searched.set(false);
  }
}
