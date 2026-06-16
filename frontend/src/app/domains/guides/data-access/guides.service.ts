import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GuideEntry {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video';
  url: string;
  order?: number;
}

// Strapi v5 response shape (flat)
interface StrapiItem {
  id: number;
  documentId?: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video';
  url: string;
  order?: number;
}

interface StrapiResponse {
  data: StrapiItem[];
}

@Injectable({ providedIn: 'root' })
export class GuidesService {
  private readonly http = inject(HttpClient);

  getGuides(): Observable<GuideEntry[]> {
    if (environment.strapiUrl) {
      return this.fetchFromStrapi();
    }
    return this.fetchFromJson();
  }

  private fetchFromStrapi(): Observable<GuideEntry[]> {
    const url = `${environment.strapiUrl}/api/guide-entries?sort=order:asc&populate=*`;
    return this.http.get<StrapiResponse>(url).pipe(
      map(res => res.data.map(item => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        type: item.type,
        url: item.url,
        order: item.order,
      }))),
      catchError(() => this.fetchFromJson()) // fallback dacă Strapi e down
    );
  }

  private fetchFromJson(): Observable<GuideEntry[]> {
    return this.http.get<GuideEntry[]>('/guides.json').pipe(
      catchError(() => of([]))
    );
  }
}
