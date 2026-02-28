/**
 * Business Type Configuration
 * Defines type-specific metric fields for daily logs, stock tracking,
 * and analysis customization per business type.
 */

// ── Business type categories ──
// Maps the ProfilePage's businessType string to an internal category key
export const BUSINESS_CATEGORY_MAP = {
	Supermarket: "grocery",
	"Grocery Store": "grocery",
	Bakery: "bakery",
	"Restaurant / Café": "restaurant",
	"Retail Shop": "retail",
	Pharmacy: "pharmacy",
	"Hardware Store": "retail",
	"Clothing Store": "clothing",
	"Food Truck": "restaurant",
	Other: "general",
};

export function getBusinessCategory(businessType) {
	return BUSINESS_CATEGORY_MAP[businessType] || "general";
}

// Returns true if the business type needs stock-in/out management
export function needsStockManagement(businessType) {
	const cat = getBusinessCategory(businessType);
	return ["grocery", "pharmacy", "bakery"].includes(cat);
}

// ── Shared (common) fields present for ALL business types ──
const COMMON_FIELDS = [
	{
		key: "revenue",
		label: "Revenue / Sales",
		icon: "DollarSign",
		placeholder: "e.g. 4500",
		prefix: "$",
		type: "number",
		required: true,
	},
	{
		key: "expenses",
		label: "Total Expenses",
		icon: "TrendingDown",
		placeholder: "e.g. 2200",
		prefix: "$",
		type: "number",
		required: false,
	},
	{
		key: "customers",
		label: "Customers / Footfall",
		icon: "Users",
		placeholder: "e.g. 120",
		type: "number",
		required: false,
	},
];

// ── Per-category extra fields ──

const GROCERY_FIELDS = [
	{
		key: "orders",
		label: "Transactions",
		icon: "ShoppingCart",
		placeholder: "e.g. 85",
		type: "number",
	},
	{
		key: "avgBasketSize",
		label: "Avg Basket Size",
		icon: "ShoppingCart",
		placeholder: "e.g. 28.50",
		prefix: "$",
		type: "number",
	},
	{
		key: "itemsSold",
		label: "Total Items Sold",
		icon: "Package",
		placeholder: "e.g. 420",
		type: "number",
	},
	{
		key: "wasteShrinkage",
		label: "Waste / Shrinkage",
		icon: "Trash2",
		placeholder: "e.g. 150",
		prefix: "$",
		type: "number",
	},
	{
		key: "inventoryCount",
		label: "Ending Inventory Count",
		icon: "Package",
		placeholder: "e.g. 2400",
		type: "number",
	},
	{
		key: "topProducts",
		label: "Top Selling Products",
		icon: "Star",
		placeholder: "e.g. Milk, Bread, Eggs",
		type: "text",
	},
	{
		key: "outOfStockItems",
		label: "Out-of-Stock Items",
		icon: "AlertCircle",
		placeholder: "e.g. Rice, Sugar",
		type: "text",
	},
	{
		key: "marketingSpend",
		label: "Marketing / Promo Spend",
		icon: "Megaphone",
		placeholder: "e.g. 200",
		prefix: "$",
		type: "number",
	},
];

const RESTAURANT_FIELDS = [
	{
		key: "orders",
		label: "Orders Served",
		icon: "ShoppingCart",
		placeholder: "e.g. 65",
		type: "number",
	},
	{
		key: "avgOrderValue",
		label: "Avg Order Value",
		icon: "DollarSign",
		placeholder: "e.g. 32.00",
		prefix: "$",
		type: "number",
	},
	{
		key: "tablesTurned",
		label: "Tables Turned",
		icon: "Armchair",
		placeholder: "e.g. 40",
		type: "number",
	},
	{
		key: "onlineOrders",
		label: "Online / Delivery Orders",
		icon: "Truck",
		placeholder: "e.g. 20",
		type: "number",
	},
	{
		key: "foodCost",
		label: "Food Cost",
		icon: "DollarSign",
		placeholder: "e.g. 1200",
		prefix: "$",
		type: "number",
	},
	{
		key: "wasteShrinkage",
		label: "Food Waste",
		icon: "Trash2",
		placeholder: "e.g. 80",
		prefix: "$",
		type: "number",
	},
	{
		key: "tipRevenue",
		label: "Tips Collected",
		icon: "DollarSign",
		placeholder: "e.g. 350",
		prefix: "$",
		type: "number",
	},
	{
		key: "topDishes",
		label: "Top Selling Dishes",
		icon: "Star",
		placeholder: "e.g. Pasta, Burger, Salad",
		type: "text",
	},
	{
		key: "staffCount",
		label: "Staff on Shift",
		icon: "Users",
		placeholder: "e.g. 8",
		type: "number",
	},
];

const BAKERY_FIELDS = [
	{
		key: "orders",
		label: "Orders / Transactions",
		icon: "ShoppingCart",
		placeholder: "e.g. 50",
		type: "number",
	},
	{
		key: "itemsBaked",
		label: "Items Baked",
		icon: "Package",
		placeholder: "e.g. 200",
		type: "number",
	},
	{
		key: "itemsSold",
		label: "Items Sold",
		icon: "ShoppingCart",
		placeholder: "e.g. 180",
		type: "number",
	},
	{
		key: "wasteShrinkage",
		label: "Unsold / Waste",
		icon: "Trash2",
		placeholder: "e.g. 20 items",
		type: "number",
	},
	{
		key: "ingredientsCost",
		label: "Ingredients Cost",
		icon: "DollarSign",
		placeholder: "e.g. 800",
		prefix: "$",
		type: "number",
	},
	{
		key: "topProducts",
		label: "Best Sellers",
		icon: "Star",
		placeholder: "e.g. Croissant, Sourdough",
		type: "text",
	},
	{
		key: "customOrders",
		label: "Custom / Catering Orders",
		icon: "ClipboardEdit",
		placeholder: "e.g. 3",
		type: "number",
	},
];

const RETAIL_FIELDS = [
	{
		key: "orders",
		label: "Transactions",
		icon: "ShoppingCart",
		placeholder: "e.g. 45",
		type: "number",
	},
	{
		key: "unitsSold",
		label: "Units Sold",
		icon: "Package",
		placeholder: "e.g. 120",
		type: "number",
	},
	{
		key: "avgBasketSize",
		label: "Avg Transaction Value",
		icon: "DollarSign",
		placeholder: "e.g. 55.00",
		prefix: "$",
		type: "number",
	},
	{
		key: "returnsRefunds",
		label: "Returns / Refunds",
		icon: "RotateCcw",
		placeholder: "e.g. 3",
		type: "number",
	},
	{
		key: "inventoryCount",
		label: "Inventory Count",
		icon: "Package",
		placeholder: "e.g. 850",
		type: "number",
	},
	{
		key: "marketingSpend",
		label: "Marketing Spend",
		icon: "Megaphone",
		placeholder: "e.g. 300",
		prefix: "$",
		type: "number",
	},
	{
		key: "topProducts",
		label: "Top Selling Items",
		icon: "Star",
		placeholder: "e.g. T-Shirts, Jeans",
		type: "text",
	},
];

const PHARMACY_FIELDS = [
	{
		key: "prescriptionsFilled",
		label: "Prescriptions Filled",
		icon: "ClipboardEdit",
		placeholder: "e.g. 65",
		type: "number",
	},
	{
		key: "orders",
		label: "Walk-in Sales",
		icon: "ShoppingCart",
		placeholder: "e.g. 90",
		type: "number",
	},
	{
		key: "inventoryCount",
		label: "Inventory Items",
		icon: "Package",
		placeholder: "e.g. 3200",
		type: "number",
	},
	{
		key: "expiredItems",
		label: "Expired / Disposed Items",
		icon: "Trash2",
		placeholder: "e.g. 5",
		type: "number",
	},
	{
		key: "avgBasketSize",
		label: "Avg Sale Value",
		icon: "DollarSign",
		placeholder: "e.g. 42.00",
		prefix: "$",
		type: "number",
	},
	{
		key: "topProducts",
		label: "Top Selling Products",
		icon: "Star",
		placeholder: "e.g. Vitamins, Pain Relief",
		type: "text",
	},
];

const CLOTHING_FIELDS = [
	{
		key: "orders",
		label: "Transactions",
		icon: "ShoppingCart",
		placeholder: "e.g. 30",
		type: "number",
	},
	{
		key: "unitsSold",
		label: "Pieces Sold",
		icon: "Package",
		placeholder: "e.g. 55",
		type: "number",
	},
	{
		key: "avgBasketSize",
		label: "Avg Transaction Value",
		icon: "DollarSign",
		placeholder: "e.g. 75.00",
		prefix: "$",
		type: "number",
	},
	{
		key: "returnsRefunds",
		label: "Returns / Exchanges",
		icon: "RotateCcw",
		placeholder: "e.g. 4",
		type: "number",
	},
	{
		key: "onlineSales",
		label: "Online Sales",
		icon: "Globe",
		placeholder: "e.g. 800",
		prefix: "$",
		type: "number",
	},
	{
		key: "inventoryCount",
		label: "Stock Count",
		icon: "Package",
		placeholder: "e.g. 600",
		type: "number",
	},
	{
		key: "marketingSpend",
		label: "Marketing Spend",
		icon: "Megaphone",
		placeholder: "e.g. 500",
		prefix: "$",
		type: "number",
	},
	{
		key: "topProducts",
		label: "Top Categories",
		icon: "Star",
		placeholder: "e.g. Dresses, Shoes",
		type: "text",
	},
];

const GENERAL_FIELDS = [
	{
		key: "orders",
		label: "Orders / Transactions",
		icon: "ShoppingCart",
		placeholder: "e.g. 85",
		type: "number",
	},
	{
		key: "marketingSpend",
		label: "Marketing Spend",
		icon: "Megaphone",
		placeholder: "e.g. 500",
		prefix: "$",
		type: "number",
	},
	{
		key: "inventory",
		label: "Inventory Count",
		icon: "Package",
		placeholder: "e.g. 340",
		type: "number",
	},
	{
		key: "avgBasketSize",
		label: "Avg Basket Size",
		icon: "ShoppingCart",
		placeholder: "e.g. 28.50",
		prefix: "$",
		type: "number",
	},
	{
		key: "wasteShrinkage",
		label: "Waste / Shrinkage",
		icon: "Trash2",
		placeholder: "e.g. 150",
		prefix: "$",
		type: "number",
	},
];

// ── Category → fields map ──
const CATEGORY_FIELDS = {
	grocery: GROCERY_FIELDS,
	restaurant: RESTAURANT_FIELDS,
	bakery: BAKERY_FIELDS,
	retail: RETAIL_FIELDS,
	pharmacy: PHARMACY_FIELDS,
	clothing: CLOTHING_FIELDS,
	general: GENERAL_FIELDS,
};

/**
 * Returns the full array of metric fields (common + category-specific)
 * for a given business type string (e.g. "Supermarket", "Restaurant / Café").
 */
export function getMetricFields(businessType) {
	const category = getBusinessCategory(businessType);
	const extra = CATEGORY_FIELDS[category] || GENERAL_FIELDS;
	return [...COMMON_FIELDS, ...extra];
}

/**
 * Returns only the numeric field keys for a category (used by backend/analysis).
 */
export function getNumericFieldKeys(businessType) {
	return getMetricFields(businessType)
		.filter((f) => f.type === "number")
		.map((f) => f.key);
}

/**
 * Returns the human-readable category label.
 */
const CATEGORY_LABELS = {
	grocery: "Grocery & Supermarket",
	restaurant: "Restaurant & Food Service",
	bakery: "Bakery",
	retail: "Retail",
	pharmacy: "Pharmacy",
	clothing: "Fashion & Clothing",
	general: "General Business",
};

export function getCategoryLabel(businessType) {
	const cat = getBusinessCategory(businessType);
	return CATEGORY_LABELS[cat] || "General Business";
}

// ── Stock management product categories per business type ──
export const STOCK_CATEGORIES = {
	grocery: [
		"Dairy & Eggs",
		"Fruits & Vegetables",
		"Meat & Seafood",
		"Bakery & Bread",
		"Beverages",
		"Snacks & Confectionery",
		"Canned & Packaged",
		"Frozen Foods",
		"Personal Care",
		"Household",
		"Other",
	],
	pharmacy: [
		"Prescription Drugs",
		"OTC Medicines",
		"Vitamins & Supplements",
		"Personal Care",
		"Baby Care",
		"Medical Devices",
		"First Aid",
		"Other",
	],
	bakery: [
		"Bread & Rolls",
		"Pastries & Croissants",
		"Cakes & Pies",
		"Cookies & Biscuits",
		"Ingredients & Raw Materials",
		"Packaging",
		"Other",
	],
};
