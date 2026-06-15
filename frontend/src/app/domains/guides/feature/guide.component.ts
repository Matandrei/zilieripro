import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { GuideItem } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-guide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Ghid de utilizare</h1>
        <p class="text-sm text-muted-foreground mt-1">Apasă pe buton pentru a deschide ghidul sau tutorialul video în browser.</p>
      </div>

      @if (loading()) {
        <div class="text-center py-16 text-muted-foreground text-sm">Se încarcă...</div>
      } @else if (pdfs().length === 0 && videos().length === 0) {
        <div class="text-center py-16 text-muted-foreground text-sm">Niciun ghid disponibil momentan.</div>
      } @else {
        @if (pdfs().length > 0) {
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 text-muted-foreground"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
              <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ghiduri PDF</h2>
              <div class="flex-1 h-px bg-border"></div>
            </div>
            <div class="space-y-3">
              @for (item of pdfs(); track item.id) {
                <div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 shrink-0 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-foreground truncate">{{ item.title }}</p>
                      @if (item.description) {
                        <p class="text-xs text-muted-foreground truncate">{{ item.description }}</p>
                      }
                    </div>
                  </div>
                  <a [href]="item.url" target="_blank" rel="noopener noreferrer"
                    class="inline-flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>
                    Deschide PDF
                  </a>
                </div>
              }
            </div>
          </div>
        }

        @if (videos().length > 0) {
          <div>
            <div class="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 text-muted-foreground"><path stroke-linecap="round" stroke-linejoin="round" d="m15 10 4.553-2.07A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tutoriale video</h2>
              <div class="flex-1 h-px bg-border"></div>
            </div>
            <div class="space-y-3">
              @for (item of videos(); track item.id) {
                <div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 shrink-0 text-green-600"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-foreground truncate">{{ item.title }}</p>
                      @if (item.description) {
                        <p class="text-xs text-muted-foreground truncate">{{ item.description }}</p>
                      }
                    </div>
                  </div>
                  <a [href]="item.url" target="_blank" rel="noopener noreferrer"
                    class="inline-flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>
                    Deschide video
                  </a>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class GuideComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  private readonly guides = signal<GuideItem[]>([]);

  protected readonly pdfs = computed(() =>
    this.guides().filter(g => g.isActive && g.type === 'pdf').sort((a, b) => a.sortOrder - b.sortOrder)
  );
  protected readonly videos = computed(() =>
    this.guides().filter(g => g.isActive && g.type === 'video').sort((a, b) => a.sortOrder - b.sortOrder)
  );

  ngOnInit(): void {
    this.api.getGuides().subscribe({
      next: (items) => { this.guides.set(items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
