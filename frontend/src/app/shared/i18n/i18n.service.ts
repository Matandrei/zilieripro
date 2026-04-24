import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'ro' | 'ru' | 'en';

const LANG_KEY = 'ez_lang';

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  ro: {
    'nav.vouchers': 'Vouchere',
    'nav.workers': 'Lucratori',
    'nav.reports': 'Rapoarte',
    'nav.ipc21': 'IPC-21',
    'nav.company': 'Profil companie',
    'nav.dashboard': 'Dashboard',
    'nav.users': 'Utilizatori',
    'nav.params': 'Parametri sistem',
    'nav.nomenclators': 'Nomenclatoare',
    'nav.audit': 'Audit trail',
    'nav.myVouchers': 'Voucherele mele',
    'action.logout': 'Iesire',
    'action.create': 'Creeaza',
    'action.edit': 'Editeaza',
    'action.save': 'Salveaza',
    'action.cancel': 'Anuleaza',
    'action.close': 'Inchide',
    'action.search': 'Cauta',
    'action.exportCsv': 'Export CSV',
    'action.print': 'Tipareste',
    'action.activate': 'Activeaza',
    'action.execute': 'Executa',
    'action.report': 'Raporteaza',
    'status.emis': 'Emis',
    'status.activ': 'Activ',
    'status.executat': 'Executat',
    'status.raportat': 'Raportat',
    'status.anulat': 'Anulat',
    'common.total': 'Total',
    'common.status': 'Statut',
    'common.noResults': 'Nu au fost gasite rezultate.',
    'common.loading': 'Se incarca...',
    'lang.label': 'Limba',
  },
  ru: {
    'nav.vouchers': 'Ваучеры',
    'nav.workers': 'Работники',
    'nav.reports': 'Отчеты',
    'nav.ipc21': 'IPC-21',
    'nav.company': 'Профиль компании',
    'nav.dashboard': 'Панель',
    'nav.users': 'Пользователи',
    'nav.params': 'Параметры системы',
    'nav.nomenclators': 'Номенклатуры',
    'nav.audit': 'Журнал аудита',
    'nav.myVouchers': 'Мои ваучеры',
    'action.logout': 'Выход',
    'action.create': 'Создать',
    'action.edit': 'Редактировать',
    'action.save': 'Сохранить',
    'action.cancel': 'Отмена',
    'action.close': 'Закрыть',
    'action.search': 'Поиск',
    'action.exportCsv': 'Экспорт CSV',
    'action.print': 'Печать',
    'action.activate': 'Активировать',
    'action.execute': 'Выполнить',
    'action.report': 'Отчитаться',
    'status.emis': 'Выпущен',
    'status.activ': 'Активен',
    'status.executat': 'Выполнен',
    'status.raportat': 'Отчитан',
    'status.anulat': 'Отменен',
    'common.total': 'Всего',
    'common.status': 'Статус',
    'common.noResults': 'Результатов не найдено.',
    'common.loading': 'Загрузка...',
    'lang.label': 'Язык',
  },
  en: {
    'nav.vouchers': 'Vouchers',
    'nav.workers': 'Workers',
    'nav.reports': 'Reports',
    'nav.ipc21': 'IPC-21',
    'nav.company': 'Company profile',
    'nav.dashboard': 'Dashboard',
    'nav.users': 'Users',
    'nav.params': 'System parameters',
    'nav.nomenclators': 'Nomenclatures',
    'nav.audit': 'Audit trail',
    'nav.myVouchers': 'My vouchers',
    'action.logout': 'Logout',
    'action.create': 'Create',
    'action.edit': 'Edit',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.search': 'Search',
    'action.exportCsv': 'Export CSV',
    'action.print': 'Print',
    'action.activate': 'Activate',
    'action.execute': 'Execute',
    'action.report': 'Report',
    'status.emis': 'Issued',
    'status.activ': 'Active',
    'status.executat': 'Executed',
    'status.raportat': 'Reported',
    'status.anulat': 'Cancelled',
    'common.total': 'Total',
    'common.status': 'Status',
    'common.noResults': 'No results found.',
    'common.loading': 'Loading...',
    'lang.label': 'Language',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.initial());
  readonly dict = computed<Dict>(() => DICTS[this.lang()]);

  private initial(): Lang {
    if (typeof localStorage === 'undefined') return 'ro';
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === 'ro' || saved === 'ru' || saved === 'en') return saved;
    return 'ro';
  }

  setLang(l: Lang): void {
    this.lang.set(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l;
  }

  t(key: string): string {
    return this.dict()[key] ?? key;
  }
}
