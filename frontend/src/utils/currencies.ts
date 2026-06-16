export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  subUnit: string;
  useIndianFormat?: boolean;
}

export const CURRENCIES: CurrencyConfig[] = [
  // North America
  { code: 'USD', symbol: '$', name: 'Dollars', subUnit: 'Cents' },
  { code: 'CAD', symbol: 'C$', name: 'Dollars', subUnit: 'Cents' },
  { code: 'MXN', symbol: '$', name: 'Pesos', subUnit: 'Centavos' },
  
  // Europe
  { code: 'EUR', symbol: '€', name: 'Euros', subUnit: 'Cents' },
  { code: 'GBP', symbol: '£', name: 'Pounds', subUnit: 'Pence' },
  { code: 'CHF', symbol: 'CHF', name: 'Francs', subUnit: 'Rappen' },
  { code: 'SEK', symbol: 'kr', name: 'Krona', subUnit: 'Öre' },
  { code: 'NOK', symbol: 'kr', name: 'Kroner', subUnit: 'Øre' },
  { code: 'DKK', symbol: 'kr', name: 'Kroner', subUnit: 'Øre' },
  { code: 'PLN', symbol: 'zł', name: 'Zlotys', subUnit: 'Grosz' },
  { code: 'RUB', symbol: '₽', name: 'Rubles', subUnit: 'Kopeks' },
  { code: 'TRY', symbol: '₺', name: 'Lira', subUnit: 'Kurus' },
  { code: 'HUF', symbol: 'Ft', name: 'Forints', subUnit: 'Fillér' },
  { code: 'CZK', symbol: 'Kč', name: 'Koruna', subUnit: 'Haléř' },
  { code: 'RON', symbol: 'lei', name: 'Lei', subUnit: 'Bani' },

  // Gulf & Middle East
  { code: 'AED', symbol: 'AED', name: 'Dirhams', subUnit: 'Fils' },
  { code: 'SAR', symbol: 'SAR', name: 'Riyals', subUnit: 'Halalas' },
  { code: 'QAR', symbol: 'QAR', name: 'Riyals', subUnit: 'Dirhams' },
  { code: 'KWD', symbol: 'KWD', name: 'Dinars', subUnit: 'Fils' },
  { code: 'OMR', symbol: 'OMR', name: 'Riyals', subUnit: 'Baisa' },
  { code: 'BHD', symbol: 'BHD', name: 'Dinars', subUnit: 'Fils' },
  { code: 'JOD', symbol: 'JOD', name: 'Dinars', subUnit: 'Piastres' },
  { code: 'ILS', symbol: '₪', name: 'Shekels', subUnit: 'Agorot' },
  { code: 'EGP', symbol: 'EGP', name: 'Pounds', subUnit: 'Piastres' },

  // Africa
  { code: 'ZAR', symbol: 'R', name: 'Rand', subUnit: 'Cents' },
  { code: 'NGN', symbol: '₦', name: 'Naira', subUnit: 'Kobo' },
  { code: 'KES', symbol: 'KSh', name: 'Shillings', subUnit: 'Cents' },
  { code: 'GHS', symbol: 'GH₵', name: 'Cedis', subUnit: 'Pesewas' },
  { code: 'MAD', symbol: 'MAD', name: 'Dirhams', subUnit: 'Centimes' },
  { code: 'DZD', symbol: 'DZD', name: 'Dinars', subUnit: 'Santeems' },
  { code: 'TND', symbol: 'TND', name: 'Dinars', subUnit: 'Millimes' },
  { code: 'ETB', symbol: 'Br', name: 'Birr', subUnit: 'Santim' },
  { code: 'UGX', symbol: 'USh', name: 'Shillings', subUnit: 'Cents' },
  { code: 'TZS', symbol: 'TSh', name: 'Shillings', subUnit: 'Cents' },
  { code: 'RWF', symbol: 'FRw', name: 'Francs', subUnit: 'Centimes' },
  { code: 'ZMW', symbol: 'ZK', name: 'Kwacha', subUnit: 'Ngwee' },
  { code: 'MZN', symbol: 'MT', name: 'Meticais', subUnit: 'Centavos' },
  { code: 'ANG', symbol: 'NAf', name: 'Guilders', subUnit: 'Cents' },
  { code: 'MUR', symbol: '₨', name: 'Rupees', subUnit: 'Cents' },
  { code: 'SCR', symbol: '₨', name: 'Rupees', subUnit: 'Cents' },

  // Asia & Oceania
  { code: 'INR', symbol: '₹', name: 'Rupees', subUnit: 'Paise', useIndianFormat: true },
  { code: 'JPY', symbol: '¥', name: 'Yen', subUnit: 'Sen' },
  { code: 'CNY', symbol: '¥', name: 'Yuan', subUnit: 'Fen' },
  { code: 'SGD', symbol: 'S$', name: 'Dollars', subUnit: 'Cents' },
  { code: 'HKD', symbol: 'HK$', name: 'Dollars', subUnit: 'Cents' },
  { code: 'AUD', symbol: 'A$', name: 'Dollars', subUnit: 'Cents' },
  { code: 'NZD', symbol: 'NZ$', name: 'Dollars', subUnit: 'Cents' },
  { code: 'KRW', symbol: '₩', name: 'Won', subUnit: 'Jeon' },
  { code: 'MYR', symbol: 'RM', name: 'Ringgits', subUnit: 'Sen' },
  { code: 'THB', symbol: '฿', name: 'Baht', subUnit: 'Satang' },
  { code: 'IDR', symbol: 'Rp', name: 'Rupiahs', subUnit: 'Sen' },
  { code: 'PHP', symbol: '₱', name: 'Pesos', subUnit: 'Centavos' },
  { code: 'VND', symbol: '₫', name: 'Dong', subUnit: 'Xu' },
  { code: 'PKR', symbol: '₨', name: 'Rupees', subUnit: 'Paisa' },
  { code: 'LKR', symbol: '₨', name: 'Rupees', subUnit: 'Cents' },
  { code: 'BDT', symbol: '৳', name: 'Taka', subUnit: 'Poisha' },
  { code: 'NPR', symbol: '₨', name: 'Rupees', subUnit: 'Paisa' }
];

export const CURRENCY_SYMBOLS: Record<string, string> = CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c.symbol;
  return acc;
}, {} as Record<string, string>);
