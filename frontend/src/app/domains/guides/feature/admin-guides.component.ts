import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { GuideItem } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-admin-guides',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">Ghiduri utilizator</h1>
          <p class="text-sm text-muted-foreground mt-1">Adaugă, editează sau șterge ghiduri PDF și video afișate angajatorilor.</p>
        </div>
        <button type="button" (click)="openAdd()"
          class="inline-flex h-9 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Adaugă ghid
        </button>
      </div>

      @if (successMsg()) {
        <div class="mb-4 p-3 bg-success/10 border border-success/20 rounded-md text-sm text-success">{{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">{{ errorMsg() }}</div>
      }

      @if (loading()) {
        <div class="text-center py-16 text-muted-foreground text-sm">Se încarcă...</div>
      } @else {
        <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <table class="w-full text-sm">
            <thead class="border-b border-foreground/10">
              <tr class="text-muted-foreground">
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide w-8">#</th>
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide">Titlu</th>
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide hidden md:table-cell">Descriere</th>
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide">Tip</th>
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide hidden sm:table-cell">URL</th>
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide">Activ</th>
                <th class="h-10 px-4 text-start align-middle font-medium text-xs uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              @if (guides().length === 0) {
                <tr><td colspan="7" class="px-4 py-8 text-center text-muted-foreground">Niciun ghid adăugat încă.</td></tr>
              } @else {
                @for (g of sortedGuides(); track g.id) {
                  <tr class="border-b border-foreground/5 hover:bg-muted/30 transition-colors">
                    <td class="px-4 py-3 text-muted-foreground text-xs">{{ g.sortOrder }}</td>
                    <td class="px-4 py-3 font-medium">{{ g.title }}</td>
                    <td class="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{{ g.description || '—' }}</td>
                    <td class="px-4 py-3">
                      <span [class]="g.type === 'pdf'
                        ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700'
                        : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'">
                        {{ g.type === 'pdf' ? 'PDF' : 'Video' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 hidden sm:table-cell max-w-[160px]">
                      <a [href]="g.url" target="_blank" rel="noopener"
                        class="text-primary hover:underline text-xs truncate block">
                        {{ g.url }}
                      </a>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="g.isActive ? 'text-success text-xs font-medium' : 'text-muted-foreground text-xs'">
                        {{ g.isActive ? 'Da' : 'Nu' }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1">
                        <button type="button" (click)="openEdit(g)"
                          class="size-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors" title="Editează">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button type="button" (click)="confirmDelete(g)"
                          class="size-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors" title="Șterge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Add / Edit modal -->
      @if (modalOpen()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" (click)="closeModal()">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-4">{{ editingId() ? 'Editează ghid' : 'Adaugă ghid' }}</h3>
            <div class="space-y-3">
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Titlu *</label>
                <input type="text" [(ngModel)]="form.title"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                  placeholder="ex: Creare și emitere voucher" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Descriere</label>
                <input type="text" [(ngModel)]="form.description"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                  placeholder="Scurtă descriere (opțional)" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Tip *</label>
                  <select [(ngModel)]="form.type"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm">
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Ordine afișare</label>
                  <input type="number" [(ngModel)]="form.sortOrder" min="0"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">URL *</label>
                <input type="url" [(ngModel)]="form.url"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                  placeholder="https://..." />
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="isActive" [(ngModel)]="form.isActive" class="rounded" />
                <label for="isActive" class="text-sm text-foreground">Activ (vizibil pentru angajatori)</label>
              </div>
            </div>
            @if (modalError()) {
              <div class="mt-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">{{ modalError() }}</div>
            }
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="closeModal()" [disabled]="submitting()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm disabled:opacity-50">Anulează</button>
              <button type="button" (click)="save()" [disabled]="submitting()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (submitting()) { Se salvează... } @else { Salvează }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete confirm modal -->
      @if (deleteTarget()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" (click)="deleteTarget.set(null)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-2">Șterge ghid</h3>
            <p class="text-sm text-muted-foreground mb-5">Ești sigur că vrei să ștergi <strong>{{ deleteTarget()!.title }}</strong>? Acțiunea nu poate fi anulată.</p>
            <div class="flex justify-end gap-2">
              <button type="button" (click)="deleteTarget.set(null)"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">Anulează</button>
              <button type="button" (click)="doDelete()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-destructive text-white px-4 text-sm font-medium">Șterge</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminGuidesComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly guides = signal<GuideItem[]>([]);
  protected readonly successMsg = signal('');
  protected readonly errorMsg = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly submitting = signal(false);
  protected readonly modalError = signal('');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<GuideItem | null>(null);

  protected form: { title: string; description: string; type: 'pdf' | 'video'; url: string; sortOrder: number; isActive: boolean } = {
    title: '', description: '', type: 'pdf', url: '', sortOrder: 0, isActive: true,
  };

  protected readonly sortedGuides = () =>
    [...this.guides()].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getGuides().subscribe({
      next: (items) => { this.guides.set(items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected openAdd(): void {
    this.editingId.set(null);
    this.form = { title: '', description: '', type: 'pdf', url: '', sortOrder: this.guides().length, isActive: true };
    this.modalError.set('');
    this.modalOpen.set(true);
  }

  protected openEdit(g: GuideItem): void {
    this.editingId.set(g.id);
    this.form = { title: g.title, description: g.description ?? '', type: g.type, url: g.url, sortOrder: g.sortOrder, isActive: g.isActive };
    this.modalError.set('');
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected save(): void {
    this.modalError.set('');
    if (!this.form.title.trim()) { this.modalError.set('Titlul este obligatoriu.'); return; }
    if (!this.form.url.trim()) { this.modalError.set('URL-ul este obligatoriu.'); return; }
    this.submitting.set(true);
    const body = {
      title: this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      type: this.form.type,
      url: this.form.url.trim(),
      sortOrder: Number(this.form.sortOrder) || 0,
      isActive: this.form.isActive,
    };
    const req = this.editingId()
      ? this.api.updateGuide(this.editingId()!, body)
      : this.api.createGuide(body as Omit<GuideItem, 'id'>);

    req.subscribe({
      next: () => {
        this.submitting.set(false);
        this.modalOpen.set(false);
        this.successMsg.set(this.editingId() ? 'Ghid actualizat.' : 'Ghid adăugat.');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => {
        this.submitting.set(false);
        this.modalError.set('Eroare la salvare. Încearcă din nou.');
      },
    });
  }

  protected confirmDelete(g: GuideItem): void {
    this.deleteTarget.set(g);
  }

  protected doDelete(): void {
    const g = this.deleteTarget();
    if (!g) return;
    this.api.deleteGuide(g.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMsg.set('Ghid șters.');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => {
        this.deleteTarget.set(null);
        this.errorMsg.set('Eroare la ștergere.');
        setTimeout(() => this.errorMsg.set(''), 3000);
      },
    });
  }
}
