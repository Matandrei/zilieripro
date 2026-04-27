import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

const SELECTED_COMPANY_KEY = 'ez_selected_company_idno';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  // Hydrate user from token if needed (page reload / deep link).
  if (auth.token() && !auth.user()) {
    await auth.loadUser();
  }

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Angajator must pick a company before accessing business routes.
  // Skip the check on /select-company itself to avoid a redirect loop.
  const isAngajator = auth.roleType() === 'Angajator';
  const onSelectCompany = state.url.startsWith('/select-company');
  if (isAngajator && !onSelectCompany) {
    const selected = typeof localStorage !== 'undefined'
      ? localStorage.getItem(SELECTED_COMPANY_KEY)
      : null;
    if (!selected) {
      return router.createUrlTree(['/select-company']);
    }
  }

  return true;
};
