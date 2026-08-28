interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  destructive_text_color?: string;
}

interface TelegramBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TelegramHapticFeedback {
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  selectionChanged: () => void;
}

interface TelegramUser {
  first_name: string;
  last_name?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  initData: string;
  initDataUnsafe: { user?: TelegramUser };
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
  onEvent: (eventType: 'themeChanged', callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// bg/surface/text/text2 come from Telegram's live theme when available; accent and the
// semantic (ok/bad/steel) colors stay fixed — they're part of the app's own identity
// (see design_handoff_cnc_trainer/README.md §Design Tokens).
const THEME_PARAM_TO_TOKEN: Partial<Record<keyof TelegramThemeParams, string>> = {
  bg_color: '--a-bg',
  secondary_bg_color: '--a-surface',
  text_color: '--a-text',
  hint_color: '--a-text2',
};

function applyTelegramTheme(webApp: TelegramWebApp): void {
  const root = document.documentElement;
  for (const [param, token] of Object.entries(THEME_PARAM_TO_TOKEN) as [
    keyof TelegramThemeParams,
    string,
  ][]) {
    const value = webApp.themeParams[param];
    if (value) root.style.setProperty(token, value);
  }
  root.dataset.colorScheme = webApp.colorScheme;
}

export function initTelegram(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  applyTelegramTheme(webApp);
  webApp.onEvent('themeChanged', () => applyTelegramTheme(webApp));
}

let lastBackHandler: (() => void) | null = null;

export function setBackButtonVisible(visible: boolean, onClick: () => void): void {
  const backButton = window.Telegram?.WebApp.BackButton;
  if (!backButton) return;
  if (lastBackHandler) backButton.offClick(lastBackHandler);
  if (visible) {
    backButton.onClick(onClick);
    lastBackHandler = onClick;
    backButton.show();
  } else {
    lastBackHandler = null;
    backButton.hide();
  }
}

export function hapticNotify(type: 'success' | 'error'): void {
  window.Telegram?.WebApp.HapticFeedback?.notificationOccurred(type);
}

/** Raw signed initData string, sent as the `Authorization: tma <initData>` header on
 *  API requests so the backend can verify it actually came from Telegram. Empty when
 *  the app isn't running inside a real Telegram client (e.g. plain browser testing). */
export function getInitDataRaw(): string {
  return window.Telegram?.WebApp.initData ?? '';
}

export function getTelegramUser(): { name: string; photoUrl: string | null } | null {
  const user = window.Telegram?.WebApp.initDataUnsafe.user;
  if (!user) return null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return { name, photoUrl: user.photo_url ?? null };
}
