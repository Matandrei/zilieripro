import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 h-full">
      <div
        #container
        class="relative bg-white rounded-xl ring-2 ring-dashed ring-foreground/20 overflow-hidden flex-1"
        [style.min-height.px]="fixedHeight()"
      >
        <canvas
          #canvas
          class="absolute inset-0 touch-none cursor-crosshair select-none"
          style="width: 100%; height: 100%;"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
        ></canvas>
        @if (empty()) {
          <div
            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 select-none"
          >
            <!-- Pen icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              class="size-8 text-foreground/20">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07
                   a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L18 8.625"/>
            </svg>
            <span class="text-sm text-muted-foreground/60">
              {{ 'signature.pad.placeholder' | t }}
            </span>
          </div>
        }
      </div>

      <div class="flex justify-between items-center px-0.5">
        <button
          type="button"
          (click)="clear()"
          class="inline-flex h-9 items-center gap-1.5 text-sm text-muted-foreground
                 hover:text-foreground active:opacity-60 transition-colors touch-manipulation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
            <path d="M3 6h18"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          {{ 'signature.pad.clear' | t }}
        </button>
        <span
          class="text-xs font-medium transition-colors"
          [class]="empty() ? 'text-muted-foreground' : 'text-green-600'"
        >
          {{ (empty() ? 'signature.pad.empty' : 'signature.pad.signed') | t }}
        </span>
      </div>
    </div>
  `,
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  readonly changed = output<string | null>();
  readonly fixedHeight = input(240);

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  private containerW = 0;
  private containerH = 0;
  private ro?: ResizeObserver;

  protected readonly empty = signal(true);

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef().nativeElement.getContext('2d')!;
    this.resizeCanvas();
    this.ro = new ResizeObserver(() => this.resizeCanvas());
    this.ro.observe(this.containerRef().nativeElement);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  private resizeCanvas(): void {
    const container = this.containerRef().nativeElement;
    const canvas = this.canvasRef().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    // Preserve existing drawing across resize
    let tmpCanvas: HTMLCanvasElement | null = null;
    if (canvas.width > 0 && canvas.height > 0 && !this.empty()) {
      tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      tmpCanvas.getContext('2d')!.drawImage(canvas, 0, 0);
    }

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    this.containerW = w;
    this.containerH = h;

    // Reconfigure context after resize (canvas reset clears all state)
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineWidth = 2.8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#111827';
    this.ctx.fillStyle = '#111827';

    if (tmpCanvas) {
      this.ctx.drawImage(tmpCanvas, 0, 0, w, h);
    }
  }

  private canvasPoint(ev: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  onPointerDown(ev: PointerEvent): void {
    ev.preventDefault();
    this.canvasRef().nativeElement.setPointerCapture(ev.pointerId);
    const p = this.canvasPoint(ev);
    this.drawing = true;
    this.lastX = p.x;
    this.lastY = p.y;
    // Draw a small dot for taps
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
    this.ctx.fill();
    if (this.empty()) this.empty.set(false);
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
    try {
      this.canvasRef().nativeElement.releasePointerCapture(ev.pointerId);
    } catch {}
    this.emit();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.containerW, this.containerH);
    this.empty.set(true);
    this.changed.emit(null);
  }

  private emit(): void {
    if (this.empty()) {
      this.changed.emit(null);
      return;
    }
    this.changed.emit(this.canvasRef().nativeElement.toDataURL('image/png'));
  }
}
