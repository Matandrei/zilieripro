import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { NomenclatorModel } from '../../../shared/models/voucher.model';

interface NomenclatorCategory {
  key: string;
  label: string;
}

@Component({
  selector: 'app-nomenclators',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20 mb-6">Nomenclatoare</h1>

      <!-- Category Tabs (underlined style like eSocial) -->
      <div class="mb-6 border-b border-border">
        <nav class="flex gap-6">
          @for (cat of categories; track cat.key) {
            <button
              [class]="selectedCategory() === cat.key
                ? 'relative pb-3 text-sm font-medium text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground'
                : 'pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'"
              (click)="selectCategory(cat.key)"
            >
              {{ cat.label }}
            </button>
          }
        </nav>
      </div>

      <!-- Search + Add Button Row -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Cauta nomenclatura"
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearch($event)"
          />
        </div>
        <div class="sm:ml-auto">
          <button
            class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
            (click)="showAddForm.set(!showAddForm())"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adauga nomenclatura
          </button>
        </div>
      </div>

      <!-- Messages -->
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

      <!-- Add New Form (collapsible card) -->
      @if (showAddForm()) {
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <h2 class="text-lg font-semibold text-foreground mb-4">Adauga nomenclator nou</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none select-none">Cod</label>
              <input
                type="text"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="newItem().code"
                (ngModelChange)="updateNewField('code', $event)"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none select-none">Titlu RO</label>
              <input
                type="text"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="newItem().titleRo"
                (ngModelChange)="updateNewField('titleRo', $event)"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none select-none">Titlu RU</label>
              <input
                type="text"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="newItem().titleRu"
                (ngModelChange)="updateNewField('titleRu', $event)"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none select-none">Titlu EN</label>
              <input
                type="text"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="newItem().titleEn"
                (ngModelChange)="updateNewField('titleEn', $event)"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none select-none">Ordine</label>
              <input
                type="number"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                [ngModel]="newItem().sortOrder"
                (ngModelChange)="updateNewField('sortOrder', $event)"
              />
            </div>
            <div class="flex items-end gap-2">
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
                (click)="addNomenclator()"
              >
                Adauga
              </button>
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                (click)="showAddForm.set(false)"
              >
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Table -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b bg-background sticky top-0 z-10">
              <tr>
                <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">ID</th>
                <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Nume</th>
                <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Valoare</th>
                <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Tip</th>
                <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap">Statut</th>
                <th class="text-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap w-10"></th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              @for (item of filteredItems(); track item.id) {
                <tr class="hover:bg-muted/50 border-b transition-colors">
                  @if (editingId() === item.id) {
                    <!-- Inline edit mode -->
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ item.sortOrder }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap">
                      <input
                        type="text"
                        class="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        [ngModel]="editForm().titleRo"
                        (ngModelChange)="updateEditField('titleRo', $event)"
                      />
                    </td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap font-mono text-foreground/60 text-xs">{{ item.code }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/60 text-xs">{{ selectedCategory() }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          class="w-4 h-4 rounded border border-input accent-primary"
                          [ngModel]="editForm().isActive"
                          (ngModelChange)="updateEditField('isActive', $event)"
                        />
                        <span class="text-xs text-muted-foreground">Activ</span>
                      </label>
                    </td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <button
                          class="inline-flex h-7 items-center justify-center rounded-md px-2.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                          (click)="saveEdit(item)"
                        >
                          Salveaza
                        </button>
                        <button
                          class="inline-flex h-7 items-center justify-center rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                          (click)="cancelEdit()"
                        >
                          Anuleaza
                        </button>
                      </div>
                    </td>
                  } @else {
                    <!-- View mode -->
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ item.sortOrder }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground">{{ item.titleRo }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap font-mono text-foreground/60 text-xs">{{ item.code }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/60 text-xs">{{ selectedCategory() }}</td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap">
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors text-foreground">
                        <span [class]="'inline-block size-2 rounded-full ' + (item.isActive ? 'bg-green-500' : 'bg-destructive')"></span>
                        {{ item.isActive ? 'Activ' : 'Dezactivat' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-middle whitespace-nowrap">
                      <div class="relative">
                        <button
                          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          (click)="toggleMenu(item.id)"
                        >
                          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        @if (openMenuId() === item.id) {
                          <div class="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                            <button
                              class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                              (click)="startEdit(item); closeMenu()"
                            >
                              <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editeaza
                            </button>
                            @if (item.isActive) {
                              <button
                                class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none text-destructive hover:bg-destructive/10 transition-colors"
                                (click)="deactivate(item); closeMenu()"
                              >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Dezactiveaza
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
                    Nu exista nomenclatoare in aceasta categorie.
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
export class NomenclatorsComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly categories: NomenclatorCategory[] = [
    { key: 'cancellation_reasons', label: 'Motive anulare' },
    { key: 'districts', label: 'Raioane' },
    { key: 'activity_types', label: 'Tipuri activitate' },
    { key: 'legal_forms', label: 'Forme juridice' },
  ];

  protected readonly selectedCategory = signal('cancellation_reasons');
  protected readonly items = signal<NomenclatorModel[]>([]);
  protected readonly loading = signal(false);
  protected readonly showAddForm = signal(false);
  protected readonly editingId = signal('');
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly openMenuId = signal('');

  protected readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const all = this.items();
    if (!term) return all;
    return all.filter(i =>
      i.titleRo.toLowerCase().includes(term) ||
      i.code.toLowerCase().includes(term) ||
      (i.titleRu ?? '').toLowerCase().includes(term) ||
      (i.titleEn ?? '').toLowerCase().includes(term)
    );
  });

  protected readonly newItem = signal<Partial<NomenclatorModel>>({
    code: '',
    titleRo: '',
    titleRu: '',
    titleEn: '',
    sortOrder: 0,
  });

  protected readonly editForm = signal<Partial<NomenclatorModel>>({});

  ngOnInit(): void {
    this.loadItems();
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? '' : id);
  }

  protected closeMenu(): void {
    this.openMenuId.set('');
  }

  protected selectCategory(key: string): void {
    this.selectedCategory.set(key);
    this.editingId.set('');
    this.showAddForm.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.loadItems();
  }

  protected updateNewField(field: string, value: unknown): void {
    this.newItem.set({ ...this.newItem(), [field]: value });
  }

  protected updateEditField(field: string, value: unknown): void {
    this.editForm.set({ ...this.editForm(), [field]: value });
  }

  protected addNomenclator(): void {
    const item = this.newItem();
    if (!item.code || !item.titleRo) {
      this.errorMessage.set('Campurile Cod si Titlu RO sunt obligatorii.');
      return;
    }

    const body = {
      ...item,
      category: this.selectedCategory(),
      isActive: true,
    };

    this.api.post<NomenclatorModel>('/nomenclators', body).subscribe({
      next: () => {
        this.successMessage.set('Nomenclatorul a fost adaugat cu succes.');
        this.showAddForm.set(false);
        this.newItem.set({ code: '', titleRo: '', titleRu: '', titleEn: '', sortOrder: 0 });
        this.loadItems();
      },
      error: () => {
        this.errorMessage.set('Eroare la adaugarea nomenclatorului.');
      },
    });
  }

  protected startEdit(item: NomenclatorModel): void {
    this.editingId.set(item.id);
    this.editForm.set({
      titleRo: item.titleRo,
      titleRu: item.titleRu ?? '',
      titleEn: item.titleEn ?? '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected cancelEdit(): void {
    this.editingId.set('');
    this.editForm.set({});
  }

  protected saveEdit(item: NomenclatorModel): void {
    const body = this.editForm();
    this.api.put<NomenclatorModel>(`/nomenclators/${item.id}`, body).subscribe({
      next: () => {
        this.editingId.set('');
        this.editForm.set({});
        this.successMessage.set('Nomenclatorul a fost actualizat cu succes.');
        this.loadItems();
      },
      error: () => {
        this.errorMessage.set('Eroare la actualizarea nomenclatorului.');
      },
    });
  }

  protected deactivate(item: NomenclatorModel): void {
    if (confirm(`Sigur doriti sa dezactivati "${item.titleRo}"?`)) {
      this.api.delete<void>(`/nomenclators/${item.id}`).subscribe({
        next: () => {
          this.successMessage.set(`Nomenclatorul "${item.titleRo}" a fost dezactivat.`);
          this.loadItems();
        },
        error: () => {
          this.errorMessage.set('Eroare la dezactivarea nomenclatorului.');
        },
      });
    }
  }

  private loadItems(): void {
    this.loading.set(true);
    this.api.getNomenclators(this.selectedCategory()).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Eroare la incarcarea nomenclatoarelor.');
      },
    });
  }
}
