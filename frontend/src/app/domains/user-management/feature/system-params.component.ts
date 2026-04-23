import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';

interface SystemParameter {
  key: string;
  value: string;
  description: string;
  valueType: string;
}

@Component({
  selector: 'app-system-params',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">Parametri de sistem</h1>
        </div>
      </div>

      <!-- Success / Error -->
      @if (successMessage()) {
        <div class="mb-4 p-3 bg-success/10 border border-success/20 rounded-md text-sm text-success font-medium">
          {{ successMessage() }}
        </div>
      }
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
          {{ errorMessage() }}
        </div>
      }

      <!-- Table -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
              <tr>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Parametru</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Valoare</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Descriere</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Tip</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Actiuni</th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              @for (param of params(); track param.key) {
                <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                  <td class="p-2 align-middle whitespace-nowrap font-mono text-foreground/80">{{ param.key }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    @if (editingKey() === param.key) {
                      <input
                        type="text"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        [ngModel]="editValue()"
                        (ngModelChange)="editValue.set($event)"
                        (keyup.enter)="saveParam(param)"
                        (keyup.escape)="cancelEdit()"
                      />
                    } @else {
                      <span class="text-foreground/80">{{ param.value }}</span>
                    }
                  </td>
                  <td class="p-2 align-middle whitespace-nowrap text-muted-foreground">{{ param.description }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {{ param.valueType }}
                    </span>
                  </td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    @if (editingKey() === param.key) {
                      <div class="flex items-center gap-2">
                        <button
                          class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                          (click)="saveParam(param)"
                        >
                          Salveaza
                        </button>
                        <button
                          class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium border border-input bg-background shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                          (click)="cancelEdit()"
                        >
                          Anuleaza
                        </button>
                      </div>
                    } @else {
                      <button
                        class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium border border-input bg-background shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                        (click)="startEdit(param)"
                      >
                        Editeaza
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-2 align-middle whitespace-nowrap py-8 text-center text-muted-foreground">
                    Nu exista parametri de sistem.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class SystemParamsComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly params = signal<SystemParameter[]>([]);
  protected readonly loading = signal(false);
  protected readonly editingKey = signal('');
  protected readonly editValue = signal('');
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadParams();
  }

  protected startEdit(param: SystemParameter): void {
    this.editingKey.set(param.key);
    this.editValue.set(param.value);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected cancelEdit(): void {
    this.editingKey.set('');
    this.editValue.set('');
  }

  protected saveParam(param: SystemParameter): void {
    const newValue = this.editValue();
    this.api.put<SystemParameter>(`/lookup/${param.key}`, { value: newValue }).subscribe({
      next: () => {
        this.params.set(
          this.params().map((p) =>
            p.key === param.key ? { ...p, value: newValue } : p
          )
        );
        this.editingKey.set('');
        this.editValue.set('');
        this.successMessage.set(`Parametrul "${param.key}" a fost actualizat cu succes.`);
      },
      error: () => {
        this.errorMessage.set(`Eroare la actualizarea parametrului "${param.key}".`);
      },
    });
  }

  private loadParams(): void {
    this.loading.set(true);
    this.api.get<SystemParameter[]>('/lookup', { category: 'systemParameters' }).subscribe({
      next: (data) => {
        this.params.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Eroare la incarcarea parametrilor de sistem.');
      },
    });
  }
}
