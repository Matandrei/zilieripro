import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { VoucherStatus } from '../../../shared/models/voucher.model';

interface FlowStep {
  label: string;
  status: VoucherStatus;
}

@Component({
  selector: 'app-voucher-status-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start gap-0">
      <!-- Main flow -->
      <div class="flex items-center">
        @for (step of mainSteps; track step.status; let i = $index) {
          <div class="flex items-center">
            <div class="flex flex-col items-center">
              <div
                [class]="stepClasses(step.status)"
                class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ring-2 transition-colors"
              >
                {{ i + 1 }}
              </div>
              <span class="text-xs mt-1 text-muted-foreground whitespace-nowrap">{{ step.label }}</span>
            </div>
            @if (i < mainSteps.length - 1) {
              <div
                [class]="connectorClasses(step.status)"
                class="w-8 h-0.5 mb-5"
              ></div>
            }
          </div>
        }
      </div>

      <!-- Anulat branch -->
      <div class="flex items-center ml-4">
        <div class="w-6 h-0.5 mb-5 bg-foreground/20"></div>
        <div class="flex flex-col items-center">
          <div
            [class]="stepClasses('Anulat')"
            class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ring-2 transition-colors"
          >
            X
          </div>
          <span class="text-xs mt-1 text-muted-foreground">Anulat</span>
        </div>
      </div>
    </div>
  `,
})
export class VoucherStatusFlowComponent {
  currentStatus = input.required<VoucherStatus>();

  readonly mainSteps: FlowStep[] = [
    { label: 'Emis', status: 'Emis' },
    { label: 'Activ', status: 'Activ' },
    { label: 'Executat', status: 'Executat' },
    { label: 'Raportat', status: 'Raportat' },
  ];

  private readonly statusOrder: Record<VoucherStatus, number> = {
    Emis: 0,
    Activ: 1,
    Executat: 2,
    Raportat: 3,
    Anulat: -1,
  };

  stepClasses = (status: VoucherStatus): string => {
    const current = this.currentStatus();
    if (current === 'Anulat') {
      if (status === 'Anulat') return 'bg-destructive ring-destructive text-white';
      return 'bg-muted ring-foreground/20 text-muted-foreground';
    }
    const currentIdx = this.statusOrder[current];
    const stepIdx = this.statusOrder[status];
    if (status === 'Anulat') return 'bg-muted ring-foreground/20 text-muted-foreground';
    if (stepIdx < currentIdx) return 'bg-success ring-success text-white';
    if (stepIdx === currentIdx) return 'bg-primary ring-primary text-primary-foreground';
    return 'bg-muted ring-foreground/20 text-muted-foreground';
  };

  connectorClasses = (status: VoucherStatus): string => {
    const current = this.currentStatus();
    if (current === 'Anulat') return 'bg-foreground/20';
    const currentIdx = this.statusOrder[current];
    const stepIdx = this.statusOrder[status];
    return stepIdx < currentIdx ? 'bg-success' : 'bg-foreground/20';
  };
}
