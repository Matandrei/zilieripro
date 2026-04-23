import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';
import { WorkerDataService } from '../data/worker-data.service';
import { VoucherTableItem, WorkerModel } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Back button -->
      <div class="mb-4">
        <a
          routerLink="/workers"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Inapoi la lista
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="text-sm text-muted-foreground">Se incarca...</div>
        </div>
      }

      @if (worker(); as w) {
        <!-- Worker details card -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <h1 class="text-3xl font-bold tracking-tight text-foreground mb-6">{{ w.lastName }} {{ w.firstName }}</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
            <div>
              <dt class="text-sm text-muted-foreground">IDNP</dt>
              <dd class="mt-1 text-sm font-medium text-foreground font-mono">{{ w.idnp }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Nume</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.lastName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Prenume</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.firstName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Data nasterii</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.birthDate }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Telefon</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.phone || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Email</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">RSP Validat</dt>
              <dd class="mt-1 text-sm">
                @if (w.rspValidated) {
                  <span class="inline-flex items-center gap-1 text-success">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Da
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 text-destructive">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Nu
                  </span>
                }
              </dd>
            </div>
            @if (w.rspValidatedAt) {
              <div>
                <dt class="text-sm text-muted-foreground">Data validarii RSP</dt>
                <dd class="mt-1 text-sm font-medium text-foreground">{{ w.rspValidatedAt }}</dd>
              </div>
            }
            @if (w.voucherCount !== undefined) {
              <div>
                <dt class="text-sm text-muted-foreground">Numar vouchere</dt>
                <dd class="mt-1 text-sm font-medium text-foreground">{{ w.voucherCount }}</dd>
              </div>
            }
          </div>
        </div>

        <!-- Voucher history table -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">Istoric vouchere</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Cod</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Statut</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Data</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Ore</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Remunerare neta</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Remunerare bruta</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Raion</th>
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
                    <td class="p-2 align-middle whitespace-nowrap">
                      <app-status-badge [status]="voucher.status" />
                    </td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDate }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.hoursWorked }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.netRemuneration }} MDL</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.grossRemuneration }} MDL</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDistrict }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-2 align-middle py-8 text-center text-sm text-muted-foreground">
                      Nu au fost gasite vouchere pentru acest lucrator.
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
export class WorkerProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workerDataService = inject(WorkerDataService);

  protected readonly worker = signal<WorkerModel | null>(null);
  protected readonly vouchers = signal<VoucherTableItem[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorker(id);
      this.loadVouchers(id);
    }
  }

  private loadWorker(id: string): void {
    this.loading.set(true);
    this.workerDataService.getWorker(id).subscribe({
      next: (worker) => {
        this.worker.set(worker);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadVouchers(workerId: string): void {
    this.workerDataService.getWorkerVouchers(workerId).subscribe({
      next: (result) => {
        this.vouchers.set(result.items);
      },
    });
  }
}
