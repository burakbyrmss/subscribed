import i18n from "i18next";
import "intl-pluralrules";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/tr";
import "dayjs/locale/en";

dayjs.extend(localizedFormat);

import en from "./locales/en/translation.json";
import tr from "./locales/tr/translation.json";

const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
};

const findBestLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const languageCode = locales[0].languageCode;
    if (resources[languageCode as keyof typeof resources]) {
      return languageCode;
    }
  }
  return "en";
};

const language = findBestLanguage();
dayjs.locale(language);

i18n.use(initReactI18next).init({
  resources,
  lng: language,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
  compatibilityJSON: "v3",
});

export default i18n;
