const STORAGE_KEY = 'vantage.personalization.v1';

export const DEFAULT_PERSONALIZATION = {
  workspace_name: 'Vantage',
  brand_tagline: 'Strategic Operating System',
  business_name: '',
  business_email: '',
  business_phone: '',
  business_address: '',
  gstin: '',
  pan: '',
  bank_name: '',
  account_number: '',
  ifsc: '',
  upi_id: '',
  default_gst_rate: 18,
  invoice_prefix: 'VTG',
  default_invoice_template: 'vantage_elite',
  default_invoice_note: '',
};

export function getPersonalization() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PERSONALIZATION };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PERSONALIZATION };
    }

    return {
      ...DEFAULT_PERSONALIZATION,
      ...JSON.parse(raw),
    };
  } catch {
    return { ...DEFAULT_PERSONALIZATION };
  }
}

export function savePersonalization(values) {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PERSONALIZATION, ...values };
  }

  const nextValue = {
    ...DEFAULT_PERSONALIZATION,
    ...values,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  return nextValue;
}
