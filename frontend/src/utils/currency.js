const CURRENCY_META = {
	USD: { symbol: "$", locale: "en-US" },
	EUR: { symbol: "€", locale: "de-DE" },
	GBP: { symbol: "£", locale: "en-GB" },
	INR: { symbol: "₹", locale: "en-IN" },
	AED: { symbol: "د.إ", locale: "ar-AE" },
	CAD: { symbol: "C$", locale: "en-CA" },
	AUD: { symbol: "A$", locale: "en-AU" },
};

export function normalizeCurrencyCode(code) {
	const normalized = String(code || "").toUpperCase();
	return CURRENCY_META[normalized] ? normalized : "INR";
}

export function getCurrencySymbol(code) {
	const curr = CURRENCY_META[normalizeCurrencyCode(code)];
	return curr.symbol;
}

export function getCurrencyLocale(code) {
	const curr = CURRENCY_META[normalizeCurrencyCode(code)];
	return curr.locale;
}

export function formatCurrency(value, code, options = {}) {
	if (value == null || value === "") return "---";
	const num = Number(value);
	if (!Number.isFinite(num)) return String(value);

	const currencyCode = normalizeCurrencyCode(code);
	const symbol = getCurrencySymbol(currencyCode);
	const locale = getCurrencyLocale(currencyCode);
	const maximumFractionDigits = options.maximumFractionDigits ?? 0;
	const minimumFractionDigits = options.minimumFractionDigits ?? 0;

	return `${symbol}${num.toLocaleString(locale, {
		minimumFractionDigits,
		maximumFractionDigits,
	})}`;
}

export function formatCompactCurrency(value, code, options = {}) {
	if (value == null || value === "") return "---";
	const num = Number(value);
	if (!Number.isFinite(num)) return String(value);

	const currencyCode = normalizeCurrencyCode(code);
	const symbol = getCurrencySymbol(currencyCode);
	const abs = Math.abs(num);

	if (currencyCode === "INR") {
		const digits = options.maximumFractionDigits ?? 1;
		if (abs >= 10000000)
			return `${symbol}${(num / 10000000).toFixed(digits)} Cr`;
		if (abs >= 100000) return `${symbol}${(num / 100000).toFixed(digits)} L`;
		if (abs >= 1000) return `${symbol}${(num / 1000).toFixed(digits)}K`;
		return formatCurrency(num, currencyCode, options);
	}

	const locale = getCurrencyLocale(currencyCode);
	const compact = new Intl.NumberFormat(locale, {
		notation: "compact",
		maximumFractionDigits: options.maximumFractionDigits ?? 1,
	}).format(num);
	return `${symbol}${compact}`;
}

export function applyCurrencyPrefix(fields, code) {
	const symbol = getCurrencySymbol(code);
	return (fields || []).map((field) =>
		field.prefix ? { ...field, prefix: symbol } : field,
	);
}
