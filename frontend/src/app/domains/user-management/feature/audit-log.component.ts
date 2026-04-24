import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ 'admin.audit.title' | t }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ 'admin.audit.subtitle' | t }}
          {{ 'common.total' | t }}: <strong class="text-foreground">{{ totalCount() }}</strong> {{ 'admin.audit.total' | t }}.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="onSearch()"
            [placeholder]="'admin.audit.searchPlaceholder' | t"
            class="flex h-9 w-full rounded-md border border-input bg-white pl-9 pr-3 py-1 text-sm" />
        </div>
        <button type="button" (click)="reload()"
          class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground">
          {{ 'admin.audit.refresh' | t }}
        </button>
      </div>

      <div class="bg-card rounded-xl ring-1 ring-foreground/10 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
              <tr>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide text-muted-foreground">{{ 'common.date' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide text-muted-foreground">{{ 'admin.audit.user' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide text-muted-foreground">{{ 'admin.audit.action' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide text-muted-foreground">{{ 'common.details' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide text-muted-foreground">IP</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="5" class="p-6 text-center text-muted-foreground">{{ 'common.loading' | t }}</td></tr>
              } @else if (items().length === 0) {
                <tr><td colspan="5" class="p-6 text-center text-muted-foreground">{{ 'admin.audit.empty' | t }}</td></tr>
              } @else {
                @for (it of items(); track it.id) {
                  <tr class="border-b border-foreground/5 hover:bg-muted/30">
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground font-mono">{{ formatDateTime(it.createdAt) }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-foreground font-mono text-xs">{{ it.userName || '—' }}</td>
                    <td class="px-3 py-2 whitespace-nowrap font-medium text-foreground">{{ it.action }}</td>
                    <td class="px-3 py-2 text-muted-foreground text-xs">{{ it.details || '—' }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-muted-foreground font-mono text-xs">{{ it.ipAddress || '—' }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  protected readonly loading = signal(true);
  protected readonly items = signal<AuditItem[]>([]);
  protected readonly totalCount = signal(0);
  protected searchTerm = '';

  private searchTimer: number | null = null;

  ngOnInit(): void {
    this.reload();
  }

  protected onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => this.reload(), 250);
  }

  protected reload(): void {
    this.loading.set(true);
    const params: Record<string, string> = { offset: '0', limit: '200' };
    if (this.searchTerm.trim()) params['search'] = this.searchTerm.trim();
    const qs = new URLSearchParams(params).toString();
    this.http.get<{ items: AuditItem[]; totalCount: number }>(`${this.baseUrl}?${qs}`).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.totalCount.set(r.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('ro-RO');
  }
}
