import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { UserTableItem } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
          {{ isEditMode() ? 'Editare utilizator' : 'Creare utilizator nou' }}
        </h1>
        <a
          routerLink="/admin/users"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Inapoi la lista
        </a>
      </div>

      <!-- Form -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- IDNP -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">IDNP</label>
            <input
              type="text"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Introduceti IDNP (13 cifre)"
              maxlength="13"
              [ngModel]="form().idnp"
              (ngModelChange)="updateField('idnp', $event)"
            />
          </div>

          <!-- Nume -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Nume</label>
            <input
              type="text"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Numele de familie"
              [ngModel]="form().lastName"
              (ngModelChange)="updateField('lastName', $event)"
            />
          </div>

          <!-- Prenume -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Prenume</label>
            <input
              type="text"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Prenumele"
              [ngModel]="form().firstName"
              (ngModelChange)="updateField('firstName', $event)"
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Email</label>
            <input
              type="email"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="adresa@email.com"
              [ngModel]="form().email"
              (ngModelChange)="updateField('email', $event)"
            />
          </div>

          <!-- Telefon -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Telefon</label>
            <input
              type="tel"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="+373 XXXXXXXX"
              [ngModel]="form().phone"
              (ngModelChange)="updateField('phone', $event)"
            />
          </div>

          <!-- Rol -->
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Rol</label>
            <select
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="form().roleName"
              (ngModelChange)="updateField('roleName', $event)"
            >
              <option value="">-- Selectati rolul --</option>
              <option value="Angajator">Angajator</option>
              <option value="Inspector">Inspector</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <!-- Parola (only for create) -->
          @if (!isEditMode()) {
            <div class="md:col-span-2 space-y-2">
              <label class="text-sm font-medium leading-none select-none">Parola</label>
              <input
                type="password"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="Introduceti parola"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
              />
            </div>
          }
        </div>

        <!-- Error message -->
        @if (errorMessage()) {
          <div class="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
            {{ errorMessage() }}
          </div>
        }

        <!-- Success message -->
        @if (successMessage()) {
          <div class="mt-4 p-3 bg-success/10 border border-success/20 rounded-md text-sm text-success font-medium">
            {{ successMessage() }}
          </div>
        }

        <!-- Actions -->
        <div class="mt-6 flex items-center justify-end gap-3">
          <a
            routerLink="/admin/users"
            class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
          >
            Anuleaza
          </a>
          <button
            class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            [disabled]="saving()"
            (click)="save()"
          >
            {{ saving() ? 'Se salveaza...' : (isEditMode() ? 'Salveaza modificarile' : 'Creeaza utilizator') }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isEditMode = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly password = signal('');

  private userId = '';

  protected readonly form = signal<Partial<UserTableItem>>({
    idnp: '',
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    roleName: '',
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create') {
      this.userId = id;
      this.isEditMode.set(true);
      this.loadUser(id);
    }
  }

  protected updateField(field: string, value: string): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  protected save(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData = this.form();
    if (!formData.idnp || !formData.lastName || !formData.firstName || !formData.roleName) {
      this.errorMessage.set('Completati toate campurile obligatorii: IDNP, Nume, Prenume, Rol.');
      return;
    }

    if (!this.isEditMode() && !this.password()) {
      this.errorMessage.set('Parola este obligatorie pentru crearea unui utilizator nou.');
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.api.updateUser(this.userId, formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.successMessage.set('Utilizatorul a fost actualizat cu succes.');
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('Eroare la actualizarea utilizatorului. Incercati din nou.');
        },
      });
    } else {
      this.api.createUser({ ...formData, password: this.password() } as Partial<UserTableItem> & { password: string }).subscribe({
        next: () => {
          this.saving.set(false);
          this.successMessage.set('Utilizatorul a fost creat cu succes.');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('Eroare la crearea utilizatorului. Incercati din nou.');
        },
      });
    }
  }

  private loadUser(id: string): void {
    this.api.getUser(id).subscribe({
      next: (user) => {
        this.form.set({
          idnp: user.idnp,
          lastName: user.lastName,
          firstName: user.firstName,
          email: user.email ?? '',
          phone: user.phone ?? '',
          roleName: user.roleName,
        });
      },
      error: () => {
        this.errorMessage.set('Eroare la incarcarea datelor utilizatorului.');
      },
    });
  }
}
