import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RsudCompany {
  idno: string;
  companyName: string;
  legalForm: string;
  activityType: string;
  address: string;
  role: string;
  status: 'Activ' | 'Radiat';
}

const SELECTED_KEY = 'ez_selected_company_idno';

@Injectable({ providedIn: 'root' })
export class RsudService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/rsud`;

  readonly companies = signal<RsudCompany[]>([]);
  readonly selectedIdno = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(SELECTED_KEY) : null
  );

  loadCompanies(): Observable<RsudCompany[]> {
    return this.http.get<RsudCompany[]>(`${this.baseUrl}/companies`).pipe(
      tap((list) => {
        this.companies.set(list);
        // If current selection is stale (not in the list, or now Radiat), clear it.
        const sel = this.selectedIdno();
        if (sel) {
          const match = list.find((c) => c.idno === sel);
          if (!match || match.status !== 'Activ') this.select(null);
        }
      })
    );
  }

  select(idno: string | null): void {
    this.selectedIdno.set(idno);
    if (typeof localStorage !== 'undefined') {
      if (idno) localStorage.setItem(SELECTED_KEY, idno);
      else localStorage.removeItem(SELECTED_KEY);
    }
  }

  selectedCompany(): RsudCompany | null {
    const id = this.selectedIdno();
    return id ? this.companies().find((c) => c.idno === id) ?? null : null;
  }
}
