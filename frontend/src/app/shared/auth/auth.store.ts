import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { UserInfo } from '../models/voucher.model';
import { ApiService } from '../services/api.service';

const TOKEN_KEY = 'ez_token';
const REFRESH_TOKEN_KEY = 'ez_refresh_token';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
}

function loadInitialState(): AuthState {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  return {
    user: null,
    token,
    refreshToken,
    loading: false,
  };
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(loadInitialState()),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token() && !!store.user()),
    fullName: computed(() => {
      const user = store.user();
      return user ? `${user.firstName} ${user.lastName}` : '';
    }),
    permissions: computed(() => store.user()?.permissions ?? []),
    roleType: computed(() => store.user()?.roleType ?? null),
  })),
  withMethods((store) => {
    const api = inject(ApiService);
    const router = inject(Router);

    return {
      setUser(user: UserInfo): void {
        patchState(store, { user });
      },

      setToken(token: string, refreshToken: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        patchState(store, { token, refreshToken });
      },

      clearAuth(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        patchState(store, { user: null, token: null, refreshToken: null });
      },

      async login(idnp: string, password: string): Promise<void> {
        patchState(store, { loading: true });
        try {
          const response = await firstValueFrom(api.login(idnp, password));
          localStorage.setItem(TOKEN_KEY, response.token);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
          patchState(store, {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            loading: false,
          });
        } catch (error) {
          patchState(store, { loading: false });
          throw error;
        }
      },

      async loadUser(): Promise<void> {
        if (!store.token()) return;
        try {
          const user = await firstValueFrom(api.getMe());
          patchState(store, { user });
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          patchState(store, { user: null, token: null, refreshToken: null });
        }
      },

      async logout(): Promise<void> {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        patchState(store, { user: null, token: null, refreshToken: null });
        await router.navigate(['/login']);
      },

      hasPermission(permission: string): boolean {
        return store.user()?.permissions.includes(permission) ?? false;
      },
    };
  }),
);
