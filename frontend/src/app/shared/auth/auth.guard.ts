import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  // If we have a stored token but no user in memory yet (e.g. after a page
  // reload or when following a deep link), try to hydrate the user first.
  if (auth.token() && !auth.user()) {
    await auth.loadUser();
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
