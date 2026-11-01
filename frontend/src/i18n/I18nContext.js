import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import km from './km';

// To add a language: create <code>.js next to en.js, then register it here.
export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'km', label: 'ខ្មែរ', name: 'ភាសាខ្មែរ' }
];

const DICTIONARIES = { en, km };
const STORAGE_KEY = 'lang';

// Saved choice first, then the browser's language preferences, then English.
const detectLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTIONARIES[saved]) return saved;
  } catch (e) {
    // storage can be blocked (private mode); fall through to the browser language
  }

  // Preferences are ordered: use the first one we have a translation for. (Checking whether
  // Khmer appears *anywhere* in the list would switch "en-US, km-KH" visitors to Khmer.)
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const code of preferred) {
    const base = String(code || '').toLowerCase().split('-')[0];
    if (DICTIONARIES[base]) return base;
  }
  return 'en';
};

// For count-based texts: "<key>_one" / "<key>_other" chosen by the language's plural rule.
const lookup = (dictionary, key, rule) => {
  if (rule) {
    const plural = dictionary[`${key}_${rule}`] ?? dictionary[`${key}_other`];
    if (plural !== undefined) return plural;
  }
  return dictionary[key];
};

const interpolate = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text;

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(detectLanguage);

  // Keeps screen readers, hyphenation and the Khmer typography rules (html[lang='km']) right
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!DICTIONARIES[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      // not persisted, still applies for this visit
    }
  }, []);

  const pluralRules = useMemo(() => new Intl.PluralRules(lang), [lang]);

  // t('home.why.title', { name }) / t('home.productCount', { count: 3 })
  // Missing keys fall back to English, then to the key itself.
  const t = useCallback((key, vars) => {
    const rule = typeof vars?.count === 'number' ? pluralRules.select(vars.count) : null;
    const text = lookup(DICTIONARIES[lang], key, rule) ?? lookup(en, key, rule) ?? key;
    return interpolate(text, vars);
  }, [lang, pluralRules]);

  // Translates an order unit ("pieces", "rolls"...). Units the admin typed by hand
  // that we have no translation for are shown as typed.
  const unit = useCallback((name) => {
    const key = `unit.${String(name).toLowerCase()}`;
    return DICTIONARIES[lang][key] ?? en[key] ?? name;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, unit }), [lang, setLang, t, unit]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
