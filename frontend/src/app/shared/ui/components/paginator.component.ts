import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export interface PageChangeEvent {
  offset: number;
  limit: number;
}

@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      <div class="flex items-center gap-2 text-sm text-gray-700">
        <span>Rinduri per pagina:</span>
        <select
          [value]="limit()"
          (change)="onPageSizeChange($event)"
          class="rounded border-gray-300 text-sm"
        >
          @for (size of pageSizeOptions; track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
      </div>

      <div class="flex items-center gap-2 text-sm text-gray-700">
        <span>
          {{ rangeStart() }}-{{ rangeEnd() }} din {{ totalCount() }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          [disabled]="currentPage() === 1"
          (click)="goToPage(1)"
          class="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &laquo;
        </button>
        <button
          type="button"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)"
          class="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lsaquo;
        </button>
        <span class="px-2 text-sm">
          Pagina {{ currentPage() }} din {{ totalPages() }}
        </span>
        <button
          type="button"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)"
          class="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &rsaquo;
        </button>
        <button
          type="button"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(totalPages())"
          class="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &raquo;
        </button>
      </div>
    </div>
  `,
})
export class PaginatorComponent {
  offset = input.required<number>();
  limit = input.required<number>();
  totalCount = input.required<number>();

  pageChange = output<PageChangeEvent>();

  readonly pageSizeOptions = [10, 25, 50, 100];

  protected currentPage = computed(() => Math.floor(this.offset() / this.limit()) + 1);

  protected totalPages = computed(() => {
    const total = this.totalCount();
    const lim = this.limit();
    return total === 0 ? 1 : Math.ceil(total / lim);
  });

  protected rangeStart = computed(() => {
    return this.totalCount() === 0 ? 0 : this.offset() + 1;
  });

  protected rangeEnd = computed(() => {
    return Math.min(this.offset() + this.limit(), this.totalCount());
  });

  goToPage(page: number): void {
    const newOffset = (page - 1) * this.limit();
    this.pageChange.emit({ offset: newOffset, limit: this.limit() });
  }

  onPageSizeChange(event: Event): void {
    const newLimit = Number((event.target as HTMLSelectElement).value);
    this.pageChange.emit({ offset: 0, limit: newLimit });
  }
}
