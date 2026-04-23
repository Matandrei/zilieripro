import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkerDataService } from '../data/worker-data.service';
import { PaginatedResult, WorkerModel } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-worker-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">Lucratori zilieri</h1>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2 space-y-2">
            <label class="text-sm font-medium leading-none select-none">Cautare dupa IDNP sau nume</label>
            <input
              type="text"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Introduceti IDNP sau numele lucratorului"
              [ngModel]="searchTerm()"
              (ngModelChange)="onSearch($event)"
            />
          </div>
          <div class="flex items-end">
            <button
              class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              (click)="resetFilters()"
            >
              Resetare filtre
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="text-sm text-muted-foreground">Se incarca...</div>
        </div>
      }

      <!-- Table -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
              <tr>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">IDNP</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Nume</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Prenume</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Data nasterii</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Telefon</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">RSP Validat</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Actiuni</th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              @for (worker of workers(); track worker.id) {
                <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                  <td class="p-2 align-middle whitespace-nowrap font-mono">{{ worker.idnp }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <a
                      [routerLink]="['/workers', worker.id]"
                      class="text-primary hover:underline underline-offset-4 font-medium"
                    >
                      {{ worker.lastName }}
                    </a>
                  </td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ worker.firstName }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ worker.birthDate }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ worker.phone || '-' }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    @if (worker.rspValidated) {
                      <span class="inline-flex items-center text-success" title="RSP validat">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    } @else {
                      <span class="inline-flex items-center text-destructive" title="RSP nevalidat">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    }
                  </td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <a
                      [routerLink]="['/workers', worker.id]"
                      class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Detalii
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="p-2 align-middle py-8 text-center text-sm text-muted-foreground">
                    Nu au fost gasiti lucratori zilieri.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalCount() > 0) {
          <div class="px-4 py-3 border-t border-input flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              Afisare {{ offset() + 1 }} - {{ Math.min(offset() + limit(), totalCount()) }}
              din {{ totalCount() }} rezultate
            </div>
            <div class="flex items-center gap-2">
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                [disabled]="offset() === 0"
                (click)="prevPage()"
              >
                Inapoi
              </button>
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                [disabled]="offset() + limit() >= totalCount()"
                (click)="nextPage()"
              >
                Inainte
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class WorkerListComponent implements OnInit {
  private readonly workerDataService = inject(WorkerDataService);

  protected readonly workers = signal<WorkerModel[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly offset = signal(0);
  protected readonly limit = signal(25);
  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadWorkers();
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.offset.set(0);
    this.loadWorkers();
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.offset.set(0);
    this.loadWorkers();
  }

  protected prevPage(): void {
    this.offset.set(Math.max(0, this.offset() - this.limit()));
    this.loadWorkers();
  }

  protected nextPage(): void {
    this.offset.set(this.offset() + this.limit());
    this.loadWorkers();
  }

  private loadWorkers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      offset: this.offset(),
      limit: this.limit(),
    };
    const term = this.searchTerm().trim();
    if (term) {
      params['search'] = term;
    }
    this.workerDataService.getWorkers(params).subscribe({
      next: (result: PaginatedResult<WorkerModel>) => {
        this.workers.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
