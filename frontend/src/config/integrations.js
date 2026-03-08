/**
 * Billing Software Integrations Configuration
 *
 * Defines supported POS / billing platforms, their field mappings
 * to Yukti daily log fields, and connection metadata.
 *
 * Integration flow:
 *   1. User picks a platform on the Integrations page
 *   2. Enters their API key / credentials
 *   3. Yukti stores the encrypted connection in Firestore
 *   4. Platform can push data via webhook → /api/integrations/webhook/:platform
 *   5. Or user can trigger a manual sync → /api/integrations/sync
 *   6. Incoming data is mapped to Yukti daily-log fields using FIELD_MAP
 *   7. Mapped entries are saved to Firestore `users/{uid}/dailyLogs`
 */

// ── Supported platforms ──
export const PLATFORMS = [
	{
		id: "square",
		name: "Square POS",
		logo: "https://cdn.brandfetch.io/squareup.com/w/512/h/512/symbol",
		description:
			"Sync daily sales, transactions, and item-level data from Square.",
		categories: ["restaurant", "retail", "grocery", "bakery", "general"],
		website: "https://squareup.com",
		authType: "api_key", // api_key | oauth
		authFields: [
			{
				key: "accessToken",
				label: "Access Token",
				placeholder: "sq0atp-xxxx…",
				type: "password",
				helpUrl:
					"https://developer.squareup.com/docs/build-basics/access-tokens",
			},
			{
				key: "locationId",
				label: "Location ID",
				placeholder: "LXXXX…",
				type: "text",
				helpUrl: "https://developer.squareup.com/docs/locations-api",
			},
		],
		fieldMap: {
			gross_sales: "revenue",
			net_sales: "revenue",
			total_tax: null,
			total_discount: null,
			total_transactions: "orders",
			total_customers: "customers",
			avg_transaction: "avgBasketSize",
			total_refunds: "returnsRefunds",
			total_tips: "tipRevenue",
		},
	},
	{
		id: "shopify",
		name: "Shopify POS",
		logo: "https://cdn.brandfetch.io/shopify.com/w/512/h/512/symbol",
		description:
			"Import daily revenue, orders, and inventory data from your Shopify store.",
		categories: ["retail", "clothing", "grocery", "general"],
		website: "https://shopify.com",
		authType: "api_key",
		authFields: [
			{
				key: "accessToken",
				label: "Admin API Access Token",
				placeholder: "shpat_xxxx…",
				type: "password",
				helpUrl: "https://shopify.dev/docs/apps/auth/admin-app-access-tokens",
			},
			{
				key: "storeDomain",
				label: "Store Domain",
				placeholder: "mystore.myshopify.com",
				type: "text",
			},
		],
		fieldMap: {
			total_sales: "revenue",
			total_orders: "orders",
			total_customers: "customers",
			average_order_value: "avgOrderValue",
			total_refunds: "returnsRefunds",
			total_units_sold: "unitsSold",
			inventory_quantity: "inventoryCount",
		},
	},
	{
		id: "clover",
		name: "Clover POS",
		logo: "https://cdn.brandfetch.io/clover.com/w/512/h/512/symbol",
		description:
			"Pull daily sales summaries, orders, and payment data from Clover.",
		categories: ["restaurant", "retail", "grocery", "general"],
		website: "https://clover.com",
		authType: "api_key",
		authFields: [
			{
				key: "apiToken",
				label: "API Token",
				placeholder: "Your Clover API token",
				type: "password",
				helpUrl: "https://docs.clover.com/docs/using-api-tokens",
			},
			{
				key: "merchantId",
				label: "Merchant ID",
				placeholder: "MXXXX…",
				type: "text",
			},
		],
		fieldMap: {
			total_revenue: "revenue",
			num_payments: "orders",
			num_customers: "customers",
			avg_order_amount: "avgBasketSize",
			total_refunds: "returnsRefunds",
			total_tips: "tipRevenue",
		},
	},
	{
		id: "lightspeed",
		name: "Lightspeed",
		logo: "https://cdn.brandfetch.io/lightspeedhq.com/w/512/h/512/symbol",
		description:
			"Sync sales, inventory, and customer counts from Lightspeed Retail or Restaurant.",
		categories: ["restaurant", "retail", "grocery", "pharmacy", "general"],
		website: "https://lightspeedhq.com",
		authType: "api_key",
		authFields: [
			{
				key: "apiKey",
				label: "API Key",
				placeholder: "Your Lightspeed API key",
				type: "password",
			},
			{
				key: "accountId",
				label: "Account ID",
				placeholder: "12345",
				type: "text",
			},
		],
		fieldMap: {
			total_sales: "revenue",
			total_transactions: "orders",
			total_customers: "customers",
			avg_sale: "avgBasketSize",
			total_discounts: null,
			total_cost: "expenses",
			inventory_count: "inventoryCount",
		},
	},
	{
		id: "toast",
		name: "Toast POS",
		logo: "https://cdn.brandfetch.io/toasttab.com/w/512/h/512/symbol",
		description:
			"Import daily restaurant data — covers, orders, tips, and food cost from Toast.",
		categories: ["restaurant", "bakery"],
		website: "https://pos.toasttab.com",
		authType: "api_key",
		authFields: [
			{
				key: "clientId",
				label: "Client ID",
				placeholder: "Your Toast Client ID",
				type: "text",
			},
			{
				key: "clientSecret",
				label: "Client Secret",
				placeholder: "Your Toast Client Secret",
				type: "password",
				helpUrl: "https://doc.toasttab.com/openapi/configuration/",
			},
		],
		fieldMap: {
			net_sales: "revenue",
			total_orders: "orders",
			guest_count: "customers",
			avg_check: "avgOrderValue",
			total_tips: "tipRevenue",
			food_cost: "foodCost",
			labor_cost: null,
			tables_turned: "tablesTurned",
		},
	},
	{
		id: "zoho_books",
		name: "Zoho Books",
		logo: "https://cdn.brandfetch.io/zoho.com/w/512/h/512/symbol",
		description:
			"Pull daily invoiced revenue and expense summaries from Zoho Books.",
		categories: ["retail", "grocery", "pharmacy", "general"],
		website: "https://books.zoho.com",
		authType: "api_key",
		authFields: [
			{
				key: "accessToken",
				label: "OAuth Access Token",
				placeholder: "Zoho OAuth token",
				type: "password",
				helpUrl: "https://www.zoho.com/books/api/v3/introduction/#oauth",
			},
			{
				key: "organizationId",
				label: "Organization ID",
				placeholder: "12345678",
				type: "text",
			},
		],
		fieldMap: {
			total_invoiced: "revenue",
			total_expenses: "expenses",
			invoice_count: "orders",
			customer_count: "customers",
		},
	},
	{
		id: "tally_prime",
		name: "Tally Prime",
		logo: "https://cdn.brandfetch.io/tallysolutions.com/w/512/h/512/symbol",
		description:
			"India's most popular accounting software. Import daily sales vouchers, GST data, and receivables from Tally Prime.",
		categories: ["grocery", "retail", "pharmacy", "clothing", "general"],
		website: "https://tallysolutions.com",
		authType: "api_key",
		authFields: [
			{
				key: "serverUrl",
				label: "Tally Server URL",
				placeholder: "http://localhost:9000",
				type: "text",
				helpUrl:
					"https://help.tallysolutions.com/tally-prime/tally-prime-server/",
			},
			{
				key: "companyName",
				label: "Company Name (in Tally)",
				placeholder: "My Business Pvt Ltd",
				type: "text",
			},
		],
		fieldMap: {
			total_sales: "revenue",
			total_purchase: "expenses",
			receipt_count: "orders",
			cash_sales: "revenue",
			gst_collected: null,
			outstanding_receivable: null,
			customer_count: "customers",
		},
	},
	{
		id: "busy_accounting",
		name: "Busy Accounting",
		logo: null,
		description:
			"Sync sales invoices, GST reports, and stock data from Busy Accounting — widely used across India.",
		categories: ["grocery", "retail", "pharmacy", "general"],
		website: "https://busy.in",
		authType: "api_key",
		authFields: [
			{
				key: "apiKey",
				label: "Busy API Key",
				placeholder: "Your Busy API key",
				type: "password",
			},
			{
				key: "companyCode",
				label: "Company Code",
				placeholder: "e.g. MYCO01",
				type: "text",
			},
		],
		fieldMap: {
			net_sales: "revenue",
			total_expenses: "expenses",
			invoice_count: "orders",
			customer_count: "customers",
			stock_value: "inventoryCount",
		},
	},
	{
		id: "vyapar",
		name: "Vyapar",
		logo: null,
		description:
			"India's #1 GST billing app for small businesses. Import invoices, payments, and inventory from Vyapar.",
		categories: [
			"grocery",
			"retail",
			"bakery",
			"pharmacy",
			"clothing",
			"general",
		],
		website: "https://vyaparapp.in",
		authType: "api_key",
		authFields: [
			{
				key: "apiToken",
				label: "Vyapar API Token",
				placeholder: "Your Vyapar token",
				type: "password",
				helpUrl: "https://vyaparapp.in/integrations",
			},
			{
				key: "businessId",
				label: "Business ID",
				placeholder: "e.g. VYP-12345",
				type: "text",
			},
		],
		fieldMap: {
			total_invoice_amount: "revenue",
			total_expense_amount: "expenses",
			invoice_count: "orders",
			payment_received: "revenue",
			items_sold: "itemsSold",
			stock_quantity: "inventoryCount",
		},
	},
	{
		id: "petpooja",
		name: "PetPooja",
		logo: null,
		description:
			"Leading Indian restaurant POS. Import daily orders, revenue, delivery data, and food cost from PetPooja.",
		categories: ["restaurant", "bakery"],
		website: "https://petpooja.com",
		authType: "api_key",
		authFields: [
			{
				key: "apiKey",
				label: "PetPooja API Key",
				placeholder: "Your PetPooja API key",
				type: "password",
				helpUrl: "https://developers.petpooja.com",
			},
			{
				key: "restaurantId",
				label: "Restaurant ID",
				placeholder: "e.g. REST-001",
				type: "text",
			},
		],
		fieldMap: {
			total_revenue: "revenue",
			order_count: "orders",
			dine_in_count: "tablesTurned",
			online_orders: "onlineOrders",
			avg_order_value: "avgOrderValue",
			food_cost: "foodCost",
			customer_count: "customers",
			top_items: "topDishes",
		},
	},
	{
		id: "posist",
		name: "POSist (Restroworks)",
		logo: null,
		description:
			"Cloud POS for Indian restaurants. Sync daily sales, covers, delivery orders, and kitchen metrics.",
		categories: ["restaurant"],
		website: "https://posist.com",
		authType: "api_key",
		authFields: [
			{
				key: "apiKey",
				label: "POSist API Key",
				placeholder: "Your POSist API key",
				type: "password",
			},
			{
				key: "outletId",
				label: "Outlet ID",
				placeholder: "e.g. OUT-1234",
				type: "text",
			},
		],
		fieldMap: {
			net_sales: "revenue",
			total_bills: "orders",
			covers: "customers",
			avg_check_size: "avgOrderValue",
			online_sales: "onlineOrders",
			tips: "tipRevenue",
			food_cost_pct: "foodCost",
		},
	},
	{
		id: "khatabook",
		name: "Khata Book",
		logo: null,
		description:
			"Digital ledger for Indian small businesses. Import daily credit/debit entries and customer payment data.",
		categories: ["grocery", "retail", "general"],
		website: "https://khatabook.com",
		authType: "api_key",
		authFields: [
			{
				key: "phoneNumber",
				label: "Registered Phone Number",
				placeholder: "+91 98765 43210",
				type: "text",
			},
			{
				key: "apiToken",
				label: "API Token",
				placeholder: "Your Khata Book token",
				type: "password",
			},
		],
		fieldMap: {
			total_credit: "revenue",
			total_debit: "expenses",
			transaction_count: "orders",
			customer_count: "customers",
		},
	},
	{
		id: "mybillbook",
		name: "myBillBook",
		logo: null,
		description:
			"GST billing & inventory app for Indian SMEs. Import invoices, stock levels, and customer data.",
		categories: ["grocery", "retail", "pharmacy", "clothing", "general"],
		website: "https://mybillbook.in",
		authType: "api_key",
		authFields: [
			{
				key: "apiKey",
				label: "myBillBook API Key",
				placeholder: "Your myBillBook API key",
				type: "password",
			},
			{
				key: "businessId",
				label: "Business ID",
				placeholder: "e.g. MBB-5678",
				type: "text",
			},
		],
		fieldMap: {
			total_sales: "revenue",
			total_purchases: "expenses",
			invoice_count: "orders",
			items_sold: "itemsSold",
			stock_in_hand: "inventoryCount",
			customer_count: "customers",
		},
	},
	{
		id: "custom_webhook",
		name: "Custom Webhook",
		logo: null,
		description:
			"Connect any billing software by sending data to Yukti's webhook endpoint. Ideal for custom or in-house POS systems.",
		categories: [
			"grocery",
			"restaurant",
			"retail",
			"bakery",
			"pharmacy",
			"clothing",
			"general",
		],
		website: null,
		authType: "webhook_secret",
		authFields: [
			{
				key: "webhookSecret",
				label: "Webhook Secret",
				placeholder: "Auto-generated on save",
				type: "readonly",
			},
		],
		fieldMap: null, // Custom – user maps fields
	},
];

/**
 * Returns platforms relevant to a business category.
 * @param {string} businessCategory – e.g. "grocery", "restaurant"
 */
export function getPlatformsForCategory(businessCategory) {
	if (!businessCategory) return PLATFORMS;
	return PLATFORMS.filter(
		(p) =>
			p.categories.includes(businessCategory) ||
			p.categories.includes("general"),
	);
}

/**
 * Get a specific platform config by ID.
 */
export function getPlatformById(platformId) {
	return PLATFORMS.find((p) => p.id === platformId) || null;
}

/**
 * Map incoming billing data to Yukti daily log fields using a platform's fieldMap.
 * @param {Object} rawData – key/value pairs from the billing platform
 * @param {string} platformId – platform identifier
 * @returns {Object} mapped data ready for Yukti dailyLog
 */
export function mapBillingData(rawData, platformId) {
	const platform = getPlatformById(platformId);
	if (!platform || !platform.fieldMap) return rawData;

	const mapped = {};
	for (const [sourceKey, yuktiKey] of Object.entries(platform.fieldMap)) {
		if (yuktiKey && rawData[sourceKey] !== undefined) {
			// If multiple source keys map to the same Yukti key, take the first non-null
			if (mapped[yuktiKey] === undefined) {
				mapped[yuktiKey] = rawData[sourceKey];
			}
		}
	}
	return mapped;
}

/**
 * Connection status constants.
 */
export const CONNECTION_STATUS = {
	CONNECTED: "connected",
	DISCONNECTED: "disconnected",
	ERROR: "error",
	SYNCING: "syncing",
};
