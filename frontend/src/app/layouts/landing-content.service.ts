import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

// ─── Content model ────────────────────────────────────────────────
// Întreg conținutul paginii de landing. Editabil din Strapi (single type
// `landing-page`) fără redeploy; cade pe `/landing.json` dacă Strapi e down.

export interface NumberedStep {
  num: string;
  title: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FooterLogo {
  /** URL imagine logo; dacă lipsește se afișează un placeholder. */
  src?: string;
  alt?: string;
}

export interface LandingContent {
  brand: string;
  loginLabel: string;

  hero: {
    title: string;
    description: string;
    ctaLabel: string;
    imageUrl?: string;
  };

  implementation: {
    title: string;
    steps: NumberedStep[];
  };

  benefits: {
    title: string;
    subtitle: string;
    employerLabel: string;
    workerLabel: string;
    employer: string[];
    worker: string[];
  };

  infoBanner: string;

  howItWorks: {
    title: string;
    steps: NumberedStep[];
  };

  faq: {
    title: string;
    items: FaqItem[];
  };

  contact: {
    title: string;
    email: string;
  };

  footer: {
    logos: FooterLogo[];
    supportTitle: string;
    supportPhones: string[];
    legalText: string;
    copyright: string;
  };
}

interface StrapiSingleResponse {
  data: { id: number; attributes?: LandingContent } & Partial<LandingContent>;
}

@Injectable({ providedIn: 'root' })
export class LandingContentService {
  private readonly http = inject(HttpClient);

  getContent(): Observable<LandingContent | null> {
    // Deocamdată conținutul vine doar din `/landing.json`.
    // Când se integrează Strapi, decomentează linia de mai jos:
    // if (environment.strapiUrl) { return this.fetchFromStrapi(); }
    return this.fetchFromJson();
  }

  private fetchFromStrapi(): Observable<LandingContent | null> {
    // Strapi single type; `populate=deep` aduce și componentele/repeatable.
    const url = `${environment.strapiUrl}/api/landing-page?populate=deep`;
    return this.http.get<StrapiSingleResponse>(url).pipe(
      // Strapi v5 e flat, v4 pune sub `attributes` — acoperim ambele.
      map(res => (res.data?.attributes ?? (res.data as unknown as LandingContent)) ?? null),
      catchError(() => this.fetchFromJson()) // fallback dacă Strapi e down
    );
  }

  private fetchFromJson(): Observable<LandingContent | null> {
    return this.http.get<LandingContent>('/landing.json').pipe(
      catchError(() => of(null))
    );
  }
}
