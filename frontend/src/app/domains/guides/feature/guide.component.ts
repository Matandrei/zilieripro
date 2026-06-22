import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { GuidesService, GuideEntry } from '../data-access/guides.service';

interface GuideGroup {
  category: string | null;
  items: GuideEntry[];
}

@Component({
  selector: 'app-guide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Ghid de utilizare</h1>
        <p class="text-sm text-muted-foreground mt-1">Apasă pe un ghid pentru a-l deschide în Google Drive.</p>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-[72px] rounded-xl border border-border bg-card animate-pulse"></div>
          }
        </div>
      } @else if (entries().length === 0) {
        <div class="rounded-xl border border-dashed border-border bg-card/50 text-center py-16 px-6">
          <p class="text-sm text-muted-foreground">Niciun ghid disponibil momentan.</p>
        </div>
      } @else {
        @for (group of groups(); track group.category) {
          <section class="mb-8 last:mb-0">
            @if (group.category) {
              <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">{{ group.category }}</h2>
            }
            <div class="space-y-3">
              @for (item of group.items; track item.id) {
                <a [href]="item.url" target="_blank" rel="noopener noreferrer"
                  class="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/40 hover:shadow-sm">
                  <!-- Icon tip -->
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    [class]="item.type === 'video' ? 'bg-green-50' : 'bg-blue-50'">
                    @if (item.type === 'video') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 text-green-600"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                    }
                  </div>

                  <!-- Text -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium text-foreground truncate">{{ item.title }}</p>
                      <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        [class]="item.type === 'video' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'">
                        {{ item.type === 'video' ? 'Video' : 'PDF' }}
                      </span>
                    </div>
                    @if (item.description) {
                      <p class="text-xs text-muted-foreground truncate mt-0.5">{{ item.description }}</p>
                    }
                  </div>

                  <!-- Chevron / open -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
                  </svg>
                </a>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class GuideComponent implements OnInit {
  private readonly guidesService = inject(GuidesService);

  protected readonly loading = signal(true);
  protected readonly entries = signal<GuideEntry[]>([]);

  // Grupare dinamică: dacă itemii au `category`, se grupează pe secțiuni
  // (ordinea categoriilor = prima apariție); altfel o singură listă plată.
  protected readonly groups = computed<GuideGroup[]>(() => {
    const items = this.entries();
    const hasCategories = items.some(i => !!i.category?.trim());
    if (!hasCategories) {
      return [{ category: null, items }];
    }
    const order: string[] = [];
    const map = new Map<string, GuideEntry[]>();
    for (const item of items) {
      const key = item.category?.trim() || 'Altele';
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(item);
    }
    return order.map(category => ({ category, items: map.get(category)! }));
  });

  ngOnInit(): void {
    this.guidesService.getGuides().subscribe({
      next: (items) => { this.entries.set(items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
