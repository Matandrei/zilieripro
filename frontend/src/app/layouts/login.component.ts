import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../shared/auth/auth.store';
import { RoleType } from '../shared/models/voucher.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-white px-4">
      <div class="w-full sm:w-[480px] bg-card text-card-foreground flex flex-col gap-6 overflow-hidden rounded-xl py-6 text-sm shadow-xs ring-1 ring-foreground/10">
        <!-- Logo -->
        <div class="text-center px-6">
          <h1 class="text-2xl font-bold text-primary tracking-tight">eZilier</h1>
          <p class="text-sm text-muted-foreground mt-1">Sistem de management al voucherelor pentru zilieri</p>
        </div>

        <!-- Error -->
        @if (errorMessage()) {
          <div class="mx-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
            {{ errorMessage() }}
          </div>
        }

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="px-6 space-y-4">
          <!-- IDNP -->
          <div class="space-y-2">
            <label for="idnp" class="flex items-center gap-2 text-sm font-medium leading-none select-none">IDNP</label>
            <input
              id="idnp"
              type="text"
              [(ngModel)]="idnp"
              name="idnp"
              maxlength="13"
              placeholder="Introduceti IDNP (13 cifre)"
              class="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              autocomplete="username"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label for="password" class="flex items-center gap-2 text-sm font-medium leading-none select-none">Parola</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Introduceti parola"
              class="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              autocomplete="current-password"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="auth.loading()"
            class="inline-flex w-full h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-xs transition-all outline-none hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            @if (auth.loading()) {
              Se autentifica...
            } @else {
              Autentificare
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="relative px-6">
          <div class="absolute inset-0 flex items-center px-6">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-card text-muted-foreground">sau</span>
          </div>
        </div>

        <!-- MPass -->
        <div class="px-6">
          <button
            type="button"
            (click)="loginWithMPass()"
            class="inline-flex w-full h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium shadow-xs transition-all outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Autentificare prin MPass
          </button>
        </div>

        <!-- Quick login buttons -->
        <div class="px-6 border-t border-border pt-5">
          <p class="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider font-medium">Autentificare rapida (demo)</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="quickLogin('2003400111111')"
              [disabled]="auth.loading()"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium bg-primary/10 text-primary border border-primary/20 transition-all hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-50"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Angajator
            </button>
            <button
              type="button"
              (click)="quickLogin('2003400222222')"
              [disabled]="auth.loading()"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium bg-warning/15 text-warning-foreground border border-warning/30 transition-all hover:bg-warning/25 disabled:pointer-events-none disabled:opacity-50"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
              Inspector
            </button>
            <button
              type="button"
              (click)="quickLogin('2003400333333')"
              [disabled]="auth.loading()"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium bg-purple-500/10 text-purple-700 border border-purple-500/20 transition-all hover:bg-purple-500/20 disabled:pointer-events-none disabled:opacity-50"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Administrator
            </button>
            <button
              type="button"
              (click)="quickLogin('2003400444444')"
              [disabled]="auth.loading()"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium bg-success/10 text-success border border-success/20 transition-all hover:bg-success/20 disabled:pointer-events-none disabled:opacity-50"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
              Zilier
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  idnp = '';
  password = '';
  readonly errorMessage = signal('');

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    if (!this.idnp || this.idnp.length !== 13) {
      this.errorMessage.set('IDNP trebuie sa contina exact 13 cifre.');
      return;
    }

    if (!this.password) {
      this.errorMessage.set('Introduceti parola.');
      return;
    }

    try {
      await this.auth.login(this.idnp, this.password);
      this.navigateByRole(this.auth.roleType());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Autentificare esuata. Verificati datele introduse.';
      this.errorMessage.set(message);
    }
  }

  async quickLogin(idnp: string): Promise<void> {
    this.errorMessage.set('');
    this.idnp = idnp;
    this.password = 'parola123';
    try {
      await this.auth.login(idnp, 'parola123');
      this.navigateByRole(this.auth.roleType());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Autentificare esuata.';
      this.errorMessage.set(message);
    }
  }

  loginWithMPass(): void {
    this.errorMessage.set('');
    this.errorMessage.set('Autentificarea prin MPass va fi disponibila in curand.');
  }

  private navigateByRole(role: RoleType | null): void {
    switch (role) {
      case 'Administrator':
        this.router.navigate(['/admin/users']);
        break;
      case 'Zilier':
        this.router.navigate(['/my-vouchers']);
        break;
      case 'Inspector':
        this.router.navigate(['/inspector/dashboard']);
        break;
      case 'Angajator':
      default:
        this.router.navigate(['/vouchers']);
        break;
    }
  }
}
