import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'bn' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('railbite-lang', newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            style={styles.button}
            title={i18n.language === 'en' ? 'বাংলায় পড়ুন' : 'Read in English'}
        >
            {i18n.language === 'en' ? 'বাং' : 'EN'}
        </button>
    );
};

const styles = {
    button: {
        background: 'linear-gradient(135deg, #f97316, #ef4444)',
        color: '#fff',
        border: 'none',
        padding: '6px 14px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '700',
        letterSpacing: '0.5px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
    },
};

export default LanguageSwitcher;
