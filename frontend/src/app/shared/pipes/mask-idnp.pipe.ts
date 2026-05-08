import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'maskIdnp', standalone: true })
export class MaskIdnpPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const v = (value ?? '').toString();
    if (v.length < 9) return v;
    return v.slice(0, 5) + '*'.repeat(Math.max(v.length - 9, 1)) + v.slice(-4);
  }
}
