import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingContent, LandingContentService } from './landing-content.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (content(); as c) {
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <span class="text-lg font-bold text-[#2d6a2d] tracking-tight">{{ c.brand }}</span>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1 text-sm font-medium text-gray-600">
            <span class="text-[#2d6a2d] font-semibold">Ro</span>
            <span class="text-gray-300 mx-1">|</span>
            <span class="hover:text-gray-900 cursor-pointer">Ru</span>
            <span class="text-gray-300 mx-1">|</span>
            <span class="hover:text-gray-900 cursor-pointer">En</span>
          </div>
          <a routerLink="/login"
            class="inline-flex h-9 items-center justify-center rounded-md bg-[#2d6a2d] px-4 text-sm font-medium text-white hover:bg-[#235523] transition-colors">
            {{ c.loginLabel }}
          </a>
        </div>
      </div>
    </header>

    <main class="bg-white">

      <!-- Hero -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div class="border border-gray-200 rounded-2xl p-8 sm:p-10 flex flex-col lg:flex-row items-center gap-8">
          <div class="flex-1 min-w-0">
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {{ c.hero.title }}
            </h1>
            <p class="text-gray-600 leading-relaxed mb-8 max-w-xl">
              {{ c.hero.description }}
            </p>
            <a routerLink="/login"
              class="inline-flex h-11 items-center justify-center rounded-md bg-[#2d6a2d] px-8 text-sm font-semibold text-white hover:bg-[#235523] transition-colors">
              {{ c.hero.ctaLabel }}
            </a>
          </div>
          <div class="w-full lg:w-[420px] shrink-0">
            <div class="w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-[#c8e6c8]">
              @if (c.hero.imageUrl) {
                <img [src]="c.hero.imageUrl" alt="Zilieri în agricultură"
                  class="w-full h-full object-cover"
                  onerror="this.style.display='none'" />
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Etape de implementare -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="border border-gray-200 rounded-2xl p-8 sm:p-10">
          <h2 class="text-lg font-bold text-gray-900 mb-6">{{ c.implementation.title }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            @for (step of c.implementation.steps; track step.num) {
              <div class="border border-gray-200 rounded-xl p-5">
                <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#e8f5e8] text-[#2d6a2d] text-xs font-bold mb-3">
                  {{ step.num }}
                </div>
                <h3 class="text-sm font-bold text-gray-900 mb-2">{{ step.title }}</h3>
                <p class="text-xs text-gray-500 leading-relaxed">{{ step.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Beneficii -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="border border-gray-200 rounded-2xl p-8 sm:p-10">
          <h2 class="text-lg font-bold text-gray-900 mb-1">{{ c.benefits.title }}</h2>
          <p class="text-sm text-gray-500 mb-6">{{ c.benefits.subtitle }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p class="text-xs font-bold text-[#2d6a2d] uppercase tracking-wider mb-3">{{ c.benefits.employerLabel }}</p>
              <ul class="space-y-2">
                @for (item of c.benefits.employer; track item) {
                  <li class="flex items-start gap-2 text-sm text-gray-700">
                    <svg class="mt-0.5 size-4 shrink-0 text-[#2d6a2d]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    {{ item }}
                  </li>
                }
              </ul>
            </div>
            <div>
              <p class="text-xs font-bold text-[#2d6a2d] uppercase tracking-wider mb-3">{{ c.benefits.workerLabel }}</p>
              <ul class="space-y-2">
                @for (item of c.benefits.worker; track item) {
                  <li class="flex items-start gap-2 text-sm text-gray-700">
                    <svg class="mt-0.5 size-4 shrink-0 text-[#2d6a2d]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    {{ item }}
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Banner informativ -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="rounded-2xl bg-[#1e4d1e] px-8 py-6">
          <p class="text-sm text-gray-200 leading-relaxed text-center">{{ c.infoBanner }}</p>
        </div>
      </section>

      <!-- Cum funcționează -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="border border-gray-200 rounded-2xl p-8 sm:p-10">
          <h2 class="text-lg font-bold text-gray-900 mb-6">{{ c.howItWorks.title }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (step of c.howItWorks.steps; track step.num) {
              <div class="border border-gray-200 rounded-xl p-5">
                <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#2d6a2d] text-white text-xs font-bold mb-3">
                  {{ step.num }}
                </div>
                <h3 class="text-sm font-bold text-gray-900 mb-2">{{ step.title }}</h3>
                <p class="text-xs text-gray-500 leading-relaxed">{{ step.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="border border-gray-200 rounded-2xl p-8 sm:p-10">
          <h2 class="text-lg font-bold text-gray-900 mb-4">{{ c.faq.title }}</h2>
          <div class="space-y-2">
            @for (item of c.faq.items; track item.q; let i = $index) {
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <button type="button"
                  class="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-900 text-left hover:bg-gray-50 transition-colors"
                  (click)="toggleFaq(i)">
                  <span>{{ item.q }}</span>
                  <svg class="size-4 shrink-0 text-gray-500 transition-transform ml-3"
                    [class.rotate-180]="openFaq() === i"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                @if (openFaq() === i) {
                  <div class="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-[#f0f7f0]">
                    {{ item.a }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="rounded-2xl bg-[#2d6a2d] px-8 py-10 flex flex-col items-center text-center">
          <h2 class="text-xl font-bold text-white mb-4">{{ c.contact.title }}</h2>
          <a [href]="'mailto:' + c.contact.email"
            class="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20 transition-colors">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            {{ c.contact.email }}
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div class="flex flex-col lg:flex-row justify-between gap-8 mb-8">
          <div class="flex flex-wrap items-center gap-4">
            @for (logo of c.footer.logos; track $index) {
              <div class="h-12 flex items-center">
                @if (logo.src) {
                  <img [src]="logo.src" [alt]="logo.alt || 'logo'" class="h-12 object-contain" />
                } @else {
                  <div class="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-400">logo</div>
                }
              </div>
            }
          </div>
          <div class="text-sm text-gray-600">
            <p class="font-semibold text-gray-800 mb-1">{{ c.footer.supportTitle }}</p>
            @for (phone of c.footer.supportPhones; track phone) {
              <p>{{ phone }}</p>
            }
          </div>
        </div>
        <p class="text-xs text-gray-400 leading-relaxed mb-6">{{ c.footer.legalText }}</p>
        <div class="border-t border-gray-200 pt-4 text-xs text-gray-400">{{ c.footer.copyright }}</div>
      </footer>

    </main>
    } @else if (loading()) {
      <div class="min-h-screen flex items-center justify-center">
        <div class="size-8 border-2 border-[#2d6a2d] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }
  `,
})
export class LandingComponent implements OnInit {
  private readonly contentService = inject(LandingContentService);

  protected readonly content = signal<LandingContent | null>(null);
  protected readonly loading = signal(true);
  protected readonly openFaq = signal<number | null>(0);

  ngOnInit(): void {
    this.contentService.getContent().subscribe({
      next: (c) => { this.content.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected toggleFaq(i: number): void {
    this.openFaq.update(current => current === i ? null : i);
  }
}
