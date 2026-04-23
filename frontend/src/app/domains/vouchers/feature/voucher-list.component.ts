import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';
import { VoucherStore } from '../data/voucher.store';
import { VoucherDataService } from '../data/voucher-data.service';
import { PaginatedResult, VoucherStatus, VoucherTableItem } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-voucher-list',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto">
      <!-- Header -->
      <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20 mb-6">Vouchere</h1>

      <!-- Search + Date Filters Row (like eSocial) -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end mb-4">
        <div class="relative flex-1 max-w-2xl">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Cauta dupa Cod, IDNP, Lucrator"
            [ngModel]="store.state().workerIdnp"
            (ngModelChange)="onFilterChange('workerIdnp', $event)"
          />
        </div>
        <div class="flex items-end gap-3">
          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground">De la</label>
            <input
              type="date"
              class="flex h-9 w-36 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="store.state().dateFrom"
              (ngModelChange)="onFilterChange('dateFrom', $event)"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground">Pana la</label>
            <input
              type="date"
              class="flex h-9 w-36 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="store.state().dateTo"
              (ngModelChange)="onFilterChange('dateTo', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Filter Dropdowns Row -->
      <div class="flex flex-wrap items-end gap-4 mb-6">
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">Status</label>
          <select
            class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 min-w-[160px]"
            [ngModel]="store.state().status"
            (ngModelChange)="onFilterChange('status', $event)"
          >
            <option value="">Selecteaza ...</option>
            <option value="Emis">Emis</option>
            <option value="Activ">Activ</option>
            <option value="Executat">Executat</option>
            <option value="Raportat">Raportat</option>
            <option value="Anulat">Anulat</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-muted-foreground">Raion</label>
          <select
            class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 min-w-[160px]"
            [ngModel]="store.state().district"
            (ngModelChange)="onFilterChange('district', $event)"
          >
            <option value="">Selecteaza ...</option>
            <option value="Chisinau">Chisinau</option>
            <option value="Balti">Balti</option>
            <option value="Cahul">Cahul</option>
            <option value="Orhei">Orhei</option>
            <option value="Ungheni">Ungheni</option>
            <option value="Soroca">Soroca</option>
          </select>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <button type="button" (click)="openRegisterPicker()"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Registrul zilnic al zilierilor
          </button>
          <a routerLink="/vouchers/create"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Creare voucher
          </a>
        </div>
      </div>

      <!-- Register date picker modal -->
      @if (registerPickerOpen()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" (click)="closeRegisterPicker()">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-foreground mb-1">Registrul zilnic al zilierilor</h3>
            <p class="text-sm text-muted-foreground mb-4">Selectati data pentru care doriti sa generati registrul.</p>
            <label class="block text-sm font-medium mb-2">Data activitatii</label>
            <input type="date" [value]="registerDate()" (input)="registerDate.set($any($event.target).value)"
              class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="closeRegisterPicker()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium">Anuleaza</button>
              <button type="button" (click)="openRegister()" [disabled]="!registerDate()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                Genereaza registrul
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Table (no card wrapper, like eSocial) -->
      <div class="relative w-full overflow-x-auto">
        <table class="w-full caption-bottom text-sm">
          <thead class="[&_tr]:border-b bg-background sticky top-0 z-10">
            <tr>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Cod</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Lucrator</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">IDNP</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Raion</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Stare</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Status</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Ore</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Remunerare</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Data</th>
              <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap w-10"></th>
            </tr>
          </thead>
          <tbody class="[&_tr:last-child]:border-0">
            @for (voucher of vouchers(); track voucher.id) {
              <tr class="hover:bg-muted/50 border-b transition-colors">
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <a [routerLink]="['/vouchers', voucher.id]" class="text-primary hover:underline underline-offset-4 font-medium text-sm">
                    {{ voucher.code }}
                  </a>
                </td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground">{{ voucher.workerFullName }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/60 font-mono text-xs">{{ voucher.workerIdnp ?? '—' }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDistrict }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5 text-sm">
                    <span [class]="'inline-block size-2 rounded-full ' + stateColor(voucher.status)"></span>
                    {{ stateLabel(voucher.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5 text-sm">
                    <span [class]="'inline-block size-2 rounded-full ' + statusDotColor(voucher.status)"></span>
                    {{ voucher.status }}
                  </span>
                </td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.hoursWorked }}h</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.netRemuneration }} MDL</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDate }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <div class="relative">
                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      (click)="toggleMenu(voucher.id)"
                    >
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    @if (openMenuId() === voucher.id) {
                      <div class="absolute right-0 top-full mt-1 z-[100] min-w-[180px] rounded-md border border-foreground/10 bg-white p-1 text-foreground shadow-lg">
                        <a
                          [routerLink]="['/vouchers', voucher.id]"
                          class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          (click)="closeMenu()"
                        >
                          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Vizualizeaza
                        </a>
                        @if (voucher.status === 'Emis') {
                          <button
                            class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            (click)="activateVoucher(voucher); closeMenu()"
                          >
                            <svg class="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Activeaza
                          </button>
                        }
                        @if (voucher.status === 'Activ') {
                          <button
                            class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            (click)="executeVoucher(voucher); closeMenu()"
                          >
                            <svg class="h-4 w-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            Executa
                          </button>
                        }
                        @if (voucher.status === 'Executat') {
                          <button
                            class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            (click)="reportVoucher(voucher); closeMenu()"
                          >
                            <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Raporteaza
                          </button>
                        }
                        @if (voucher.status === 'Emis' || voucher.status === 'Activ') {
                          <button
                            class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none text-destructive hover:bg-destructive/10 transition-colors"
                            (click)="cancelVoucher(voucher); closeMenu()"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            Anuleaza
                          </button>
                        }
                      </div>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="10" class="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nu au fost gasite vouchere.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination (eSocial style) -->
      <div class="flex items-center justify-between py-4 border-t border-border mt-0">
        <div class="text-sm text-muted-foreground">
          Total: {{ totalCount() }}
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <select
              class="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none"
              [ngModel]="store.state().limit"
              (ngModelChange)="onPageSizeChange($event)"
            >
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </div>
          <div class="text-sm text-foreground">
            Pagina {{ currentPage() }} din {{ totalPages() }}
          </div>
          <div class="flex items-center gap-1">
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() <= 1"
              (click)="goToPage(1)"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() <= 1"
              (click)="prevPage()"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() >= totalPages()"
              (click)="nextPage()"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() >= totalPages()"
              (click)="goToPage(totalPages())"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VoucherListComponent implements OnInit {
  protected readonly store = inject(VoucherStore);
  private readonly voucherDataService = inject(VoucherDataService);
  private readonly router = inject(Router);

  protected readonly vouchers = signal<VoucherTableItem[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly openMenuId = signal('');

  protected readonly registerPickerOpen = signal(false);
  protected readonly registerDate = signal(new Date().toISOString().split('T')[0]);

  protected openRegisterPicker(): void {
    this.registerPickerOpen.set(true);
  }
  protected closeRegisterPicker(): void {
    this.registerPickerOpen.set(false);
  }
  protected openRegister(): void {
    const date = this.registerDate();
    this.registerPickerOpen.set(false);
    this.router.navigate(['/vouchers/register'], { queryParams: { date } });
  }

  protected readonly currentPage = computed(() => {
    const s = this.store.state();
    return Math.floor(s.offset / s.limit) + 1;
  });

  protected readonly totalPages = computed(() => {
    const s = this.store.state();
    return Math.max(1, Math.ceil(this.totalCount() / s.limit));
  });

  ngOnInit(): void {
    this.loadVouchers();
  }

  protected onFilterChange(key: string, value: string): void {
    this.store.setQuery({ [key]: value, offset: 0 });
    this.loadVouchers();
  }

  protected onPageSizeChange(size: number): void {
    this.store.setQuery({ limit: +size, offset: 0 });
    this.loadVouchers();
  }

  protected toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? '' : id);
  }

  protected closeMenu(): void {
    this.openMenuId.set('');
  }

  protected stateColor(status: string): string {
    switch (status) {
      case 'Activ': return 'bg-yellow-400';
      case 'Executat': case 'Raportat': return 'bg-red-500';
      case 'Emis': return 'bg-green-500';
      case 'Anulat': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  protected stateLabel(status: string): string {
    switch (status) {
      case 'Activ': return 'Activ';
      case 'Executat': case 'Raportat': return 'Inchis';
      case 'Emis': return 'Activ';
      case 'Anulat': return 'Inchis';
      default: return status;
    }
  }

  protected statusDotColor(status: string): string {
    switch (status) {
      case 'Emis': return 'bg-gray-400';
      case 'Activ': return 'bg-blue-500';
      case 'Executat': return 'bg-green-500';
      case 'Raportat': return 'bg-primary';
      case 'Anulat': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  protected prevPage(): void {
    const state = this.store.state();
    this.store.setQuery({ offset: Math.max(0, state.offset - state.limit) });
    this.loadVouchers();
  }

  protected nextPage(): void {
    const state = this.store.state();
    this.store.setQuery({ offset: state.offset + state.limit });
    this.loadVouchers();
  }

  protected goToPage(page: number): void {
    const state = this.store.state();
    this.store.setQuery({ offset: (page - 1) * state.limit });
    this.loadVouchers();
  }

  protected activateVoucher(voucher: VoucherTableItem): void {
    this.voucherDataService.activateVoucher(voucher.id).subscribe(() => this.loadVouchers());
  }

  protected executeVoucher(voucher: VoucherTableItem): void {
    this.voucherDataService.executeVoucher(voucher.id).subscribe(() => this.loadVouchers());
  }

  protected reportVoucher(voucher: VoucherTableItem): void {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.voucherDataService.reportVoucher(voucher.id, period).subscribe(() => this.loadVouchers());
  }

  protected cancelVoucher(voucher: VoucherTableItem): void {
    this.voucherDataService
      .cancelVoucher(voucher.id, { reason: 'CA01' })
      .subscribe(() => this.loadVouchers());
  }

  private loadVouchers(): void {
    this.loading.set(true);
    this.voucherDataService.getVouchers(this.store.queryParams()).subscribe({
      next: (result: PaginatedResult<VoucherTableItem>) => {
        this.vouchers.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
