import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { VoucherStatus } from '../../models/voucher.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="badgeClasses()"
      class="inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap"
    >
      {{ status() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<VoucherStatus>();

  protected badgeClasses = computed(() => {
    const colorMap: Record<VoucherStatus, string> = {
      Emis: 'bg-muted text-muted-foreground',
      Activ: 'bg-success/10 text-success',
      Executat: 'bg-warning/15 text-warning-foreground',
      Raportat: 'bg-primary/10 text-primary',
      Anulat: 'bg-destructive/10 text-destructive',
    };
    return colorMap[this.status()];
  });
}
