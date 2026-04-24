import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <p class="text-sm text-muted-foreground">Semnati mai jos pe zona punctata. Folositi degetul pe telefon/tableta sau mouse-ul pe desktop.</p>
      <div class="relative bg-white rounded-md ring-2 ring-dashed ring-foreground/20 overflow-hidden">
        <canvas
          #canvas
          class="w-full block touch-none cursor-crosshair"
          [width]="width"
          [height]="height"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
        ></canvas>
        @if (empty()) {
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/60">
            Semnati aici
          </div>
        }
      </div>
      <div class="flex justify-between items-center">
        <button type="button" (click)="clear()"
          class="inline-flex h-8 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Sterge si semneaza din nou
        </button>
        <span class="text-xs text-muted-foreground">{{ empty() ? 'Nesemnat' : 'Semnat' }}</span>
      </div>
    </div>
  `,
})
export class SignaturePadComponent implements AfterViewInit {
  readonly changed = output<string | null>();

  readonly width = 600;
  readonly height = 200;

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  protected readonly empty = signal(true);

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#111827';
  }

  private canvasPoint(ev: PointerEvent): { x: number; y: number } {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  }

  onPointerDown(ev: PointerEvent): void {
    ev.preventDefault();
    this.canvasRef().nativeElement.setPointerCapture(ev.pointerId);
    const p = this.canvasPoint(ev);
    this.drawing = true;
    this.lastX = p.x;
    this.lastY = p.y;
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.drawing) return;
    ev.preventDefault();
    const p = this.canvasPoint(ev);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
    this.lastX = p.x;
    this.lastY = p.y;
    if (this.empty()) this.empty.set(false);
  }

  onPointerUp(ev: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    try { this.canvasRef().nativeElement.releasePointerCapture(ev.pointerId); } catch {}
    this.emit();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvasRef().nativeElement.width, this.canvasRef().nativeElement.height);
    this.empty.set(true);
    this.changed.emit(null);
  }

  private emit(): void {
    if (this.empty()) {
      this.changed.emit(null);
      return;
    }
    const dataUrl = this.canvasRef().nativeElement.toDataURL('image/png');
    this.changed.emit(dataUrl);
  }
}
