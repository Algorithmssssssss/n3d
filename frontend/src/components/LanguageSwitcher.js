import React from 'react';
import { LANGUAGES, useI18n } from '../i18n/I18nContext';

// "EN | ខ្មែរ": both choices stay visible, so a visitor can always find their language
// even when the page is currently in one they can't read.
const LanguageSwitcher = () => {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.label')}>
      {LANGUAGES.map(({ code, label, name }) => (
        <button
          key={code}
          type="button"
          lang={code}
          title={name}
          className={`lang-btn ${lang === code ? 'active' : ''}`}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
