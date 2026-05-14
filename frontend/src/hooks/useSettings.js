/**
 * useSettings — реактивный хук для настроек сайта.
 * Данные хранятся в MongoDB, кэшируются через react-query.
 * Используется в: Footer, Header, Contacts, SocialWidget, RequestForm.
 *
 * Также экспортирует loadSettings() для обратной совместимости
 * с компонентами, которые читают настройки синхронно (не в хуке).
 */
import { useQuery } from '@tanstack/react-query';
import { SiteSettings } from '@/api/apiClient';

export const DEFAULT_SETTINGS = {
  company_name: 'Строй-Двор',
  phone:        '+7‒707‒290‒05‒05',
  phone_label:  'отдел стройматериалов',
  phone2:       '+7‒701‒320‒01‒48',
  phone2_label: 'отдел мебели для бани и сада',
  phone3:       '+7‒771‒288‒88‒09',
  phone3_label: 'отдел сантехники',
  phone4:       '+7‒747‒730‒00‒70',
  phone4_label: 'отдел сухих строительных смесей',
  phone5:       '+7‒705‒140‒89‒07',
  phone5_label: 'отдел пошива штор',
  email:        'info@stroydvor.kz',
  address:      'г. Астана, ул. Строителей, 12',
  city:         'Астана',
  work_hours:   'Пн–Сб: 9:00–19:00',
  whatsapp:     '77072900505',
  instagram:    'stroydvor_kz',
  map_link:     '',
  description:  'Строительные материалы с доставкой по Астане.',
};

/** Реактивный хук — использовать в компонентах */
export function useSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['site_settings'],
    queryFn:  SiteSettings.get,
    staleTime: 5 * 60 * 1000, // 5 min cache
    // Fallback to defaults on error
    placeholderData: DEFAULT_SETTINGS,
  });
  return { settings: { ...DEFAULT_SETTINGS, ...(data || {}) }, isLoading };
}

/** Синхронная загрузка из localStorage-кэша (для Header/AdminSettings обратной совместимости) */
export function loadSettings() {
  try {
    const cached = localStorage.getItem('site_settings_cache');
    if (cached) return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

/** Сохранить в localStorage-кэш (вызывается после успешного PUT) */
export function cacheSettings(data) {
  try { localStorage.setItem('site_settings_cache', JSON.stringify(data)); } catch {}
}

export async function saveSettings(data) {
  const mutation = useMutation({
    mutationFn: SiteSettings.save,
    onSuccess: (data) => {
      queryClient.setQueryData(['site_settings'], data); // обновляем кэш react-query
    }
  })
}
