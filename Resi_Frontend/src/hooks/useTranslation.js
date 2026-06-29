import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  return {
    t: (key) => t(language, key),
    language
  };
};
