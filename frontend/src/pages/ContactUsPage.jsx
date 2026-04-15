import { useEffect, useRef, useState } from "react";
import {
	Mail,
	Phone,
	Building2,
	Clock3,
	Send,
	CheckCircle2,
	AlertCircle,
	ChevronDown,
	Check,
} from "lucide-react";
import { submitContactInquiry } from "../services/api";

const channels = [
	{
		title: "General Inquiries",
		email: "hello@mudmedia.in",
		description:
			"Product questions, partnerships, media, and collaboration requests.",
		icon: Mail,
	},
	{
		title: "Technical Support",
		email: "support@mudmedia.in",
		description:
			"Account access, integration issues, sync failures, or usage troubleshooting.",
		detail:
			"SLA: Critical issues within 4 business hours, standard tickets within 24 business hours.",
		icon: Clock3,
	},
	{
		title: "Enterprise Sales",
		email: "sales@mudmedia.in",
		description:
			"Multi-location rollout, onboarding support, security reviews, and procurement.",
		icon: Phone,
	},
];

const BUSINESS_TYPES = ["Retail", "F&B", "E-commerce", "Other"];
const REVENUE_SCALES = ["Below 1 Cr", "1-5 Cr", "5-20 Cr", "20 Cr+"];
const PURPOSES = [
	"General Inquiry",
	"Technical Support",
	"Enterprise Sales",
	"Partnership",
	"Investor / Media",
];

function StyledSelect({
	label,
	name,
	value,
	placeholder,
	options,
	onChange,
	error,
	required,
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (!containerRef.current?.contains(event.target)) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, []);

	useEffect(() => {
		const handleEscape = (event) => {
			if (event.key === "Escape") setOpen(false);
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, []);

	const selectedLabel = value || placeholder;

	return (
		<div className="relative" ref={containerRef}>
			<label className="mb-1 block text-xs font-semibold text-slate-600">
				{label} {required ? "*" : ""}
			</label>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className={`w-full rounded-lg border px-3 py-2 text-left text-sm outline-none transition-colors ${
					error
						? "border-red-300 bg-red-50"
						: "border-slate-300 bg-white hover:border-blue-400 focus:border-blue-500"
				}`}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<div className="flex items-center justify-between gap-2">
					<span className={value ? "text-slate-900" : "text-slate-400"}>
						{selectedLabel}
					</span>
					<ChevronDown
						size={16}
						className={`shrink-0 text-blue-600 transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</div>
			</button>

			{open ? (
				<div
					className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
					role="listbox"
				>
					<button
						type="button"
						onClick={() => {
							onChange(name, "");
							setOpen(false);
						}}
						className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
							value === ""
								? "bg-blue-600 text-white"
								: "text-slate-500 hover:bg-slate-100"
						}`}
					>
						<span>{placeholder}</span>
						{value === "" ? <Check size={14} className="shrink-0" /> : null}
					</button>
					{options.map((option) => {
						const selected = value === option;
						return (
							<button
								type="button"
								key={option}
								onClick={() => {
									onChange(name, option);
									setOpen(false);
								}}
								className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
									selected
										? "bg-blue-600 text-white"
										: "text-slate-700 hover:bg-slate-100"
								}`}
							>
								<span>{option}</span>
								{selected ? <Check size={14} className="shrink-0" /> : null}
							</button>
						);
					})}
				</div>
			) : null}

			{error && <p className="mt-1 text-xs text-red-600">{error}</p>}
		</div>
	);
}

export default function ContactUsPage() {
	const [formData, setFormData] = useState({
		fullName: "",
		workEmail: "",
		companyName: "",
		businessType: "",
		revenueScale: "",
		teamSize: "",
		purpose: "",
		message: "",
		consent: false,
	});
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const [submitState, setSubmitState] = useState({ type: "", message: "" });

	const validate = () => {
		const next = {};
		if (!formData.fullName.trim()) next.fullName = "Full name is required.";
		if (!formData.workEmail.trim()) next.workEmail = "Work email is required.";
		if (formData.workEmail && !/^\S+@\S+\.\S+$/.test(formData.workEmail)) {
			next.workEmail = "Please enter a valid email address.";
		}
		if (!formData.companyName.trim())
			next.companyName = "Company name is required.";
		if (!formData.businessType)
			next.businessType = "Please select business type.";
		if (!formData.revenueScale)
			next.revenueScale = "Please select revenue scale.";
		if (!formData.purpose) next.purpose = "Please select inquiry purpose.";
		if (!formData.message.trim()) next.message = "Message is required.";
		if (formData.message.trim().length < 20) {
			next.message = "Please provide at least 20 characters for context.";
		}
		if (!formData.consent)
			next.consent = "Please provide consent before submitting.";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleChange = (event) => {
		const { name, value, type, checked } = event.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleSelectChange = (name, value) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitState({ type: "", message: "" });
		if (!validate()) return;

		setSubmitting(true);
		try {
			const response = await submitContactInquiry(formData);
			setSubmitState({
				type: "success",
				message:
					response?.message ||
					"Inquiry submitted successfully. Our team will reach out shortly.",
			});
			setFormData({
				fullName: "",
				workEmail: "",
				companyName: "",
				businessType: "",
				revenueScale: "",
				teamSize: "",
				purpose: "",
				message: "",
				consent: false,
			});
		} catch (error) {
			setSubmitState({
				type: "error",
				message:
					error?.response?.data?.detail ||
					"We could not submit your inquiry right now. Please try again in a moment.",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-white px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-3xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-8 shadow-sm md:p-12">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						Contact Us
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
						Let's build better decisions together.
					</h1>
					<p className="mt-4 max-w-4xl text-base leading-relaxed text-slate-600">
						If you're evaluating Yukti, exploring a partnership, or want to
						discuss enterprise rollout, we'd love to hear from you.
					</p>
					<div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
						<Mail size={14} />
						Response within one business day
					</div>
				</div>

				<div className="mt-8 grid gap-5 md:grid-cols-3">
					{channels.map((channel) => {
						const Icon = channel.icon;
						return (
							<div
								key={channel.title}
								className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
							>
								<div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
									<Icon size={16} />
								</div>
								<h2 className="text-base font-bold text-slate-950">
									{channel.title}
								</h2>
								<p className="mt-2 text-sm text-slate-600">
									{channel.description}
								</p>
								<a
									href={`mailto:${channel.email}`}
									className="mt-3 inline-block text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
								>
									{channel.email}
								</a>
								{channel.detail ? (
									<p className="mt-2 text-xs text-slate-500">
										{channel.detail}
									</p>
								) : null}
							</div>
						);
					})}
				</div>

				<div className="mt-8 grid gap-5 lg:grid-cols-2">
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="text-2xl font-bold text-slate-950">
							Our Parent Company
						</h2>
						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
							<p className="font-semibold text-slate-900">Mud Media lnc.</p>
							<p className="mt-1">Coimbatore, Tamil Nadu</p>
							<p>India</p>
							<a
								href="https://mudmedia.vercel.app/"
								target="_blank"
								rel="noopener noreferrer"
								className="mt-2 inline-block text-blue-950 hover:text-blue-800 font-semibold"
							>
								Visit our website
							</a>
						</div>
						<div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
							<Building2 size={15} />
							Mon-Fri, 10:00 AM - 6:30 PM IST
						</div>
					</div>

					<form
						onSubmit={handleSubmit}
						className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
					>
						<h2 className="text-2xl font-bold text-slate-950">
							Send us a message
						</h2>
						<p className="mt-2 text-sm text-slate-600">
							Share your context and we'll route your request to the right team.
						</p>

						<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="sm:col-span-1">
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Full Name *
								</label>
								<input
									name="fullName"
									value={formData.fullName}
									onChange={handleChange}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								/>
								{errors.fullName && (
									<p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
								)}
							</div>

							<div className="sm:col-span-1">
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Work Email *
								</label>
								<input
									type="email"
									name="workEmail"
									value={formData.workEmail}
									onChange={handleChange}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								/>
								{errors.workEmail && (
									<p className="mt-1 text-xs text-red-600">
										{errors.workEmail}
									</p>
								)}
							</div>

							<div className="sm:col-span-2">
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Company Name *
								</label>
								<input
									name="companyName"
									value={formData.companyName}
									onChange={handleChange}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								/>
								{errors.companyName && (
									<p className="mt-1 text-xs text-red-600">
										{errors.companyName}
									</p>
								)}
							</div>

							<StyledSelect
								label="Business Type"
								name="businessType"
								value={formData.businessType}
								placeholder="Select business type"
								options={BUSINESS_TYPES}
								onChange={handleSelectChange}
								error={errors.businessType}
								required
							/>

							<StyledSelect
								label="Revenue Scale"
								name="revenueScale"
								value={formData.revenueScale}
								placeholder="Select revenue scale"
								options={REVENUE_SCALES}
								onChange={handleSelectChange}
								error={errors.revenueScale}
								required
							/>

							<div>
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Team Size
								</label>
								<input
									name="teamSize"
									value={formData.teamSize}
									onChange={handleChange}
									placeholder="e.g. 10-25"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								/>
							</div>

							<StyledSelect
								label="Purpose of Inquiry"
								name="purpose"
								value={formData.purpose}
								placeholder="Select purpose"
								options={PURPOSES}
								onChange={handleSelectChange}
								error={errors.purpose}
								required
							/>

							<div className="sm:col-span-2">
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Message *
								</label>
								<textarea
									name="message"
									value={formData.message}
									onChange={handleChange}
									rows={5}
									placeholder="Tell us what you need help with..."
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								/>
								{errors.message && (
									<p className="mt-1 text-xs text-red-600">{errors.message}</p>
								)}
							</div>
						</div>

						<label className="mt-4 flex items-start gap-2 text-sm text-slate-600">
							<input
								type="checkbox"
								name="consent"
								checked={formData.consent}
								onChange={handleChange}
								className="mt-0.5"
							/>
							<span>
								I consent to Mud Media storing my submitted information for
								follow-up communication.
							</span>
						</label>
						{errors.consent && (
							<p className="mt-1 text-xs text-red-600">{errors.consent}</p>
						)}

						{submitState.message ? (
							<div
								className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
									submitState.type === "success"
										? "border-emerald-200 bg-emerald-50 text-emerald-700"
										: "border-red-200 bg-red-50 text-red-700"
								}`}
							>
								{submitState.type === "success" ? (
									<CheckCircle2 size={16} className="mt-0.5" />
								) : (
									<AlertCircle size={16} className="mt-0.5" />
								)}
								<span>{submitState.message}</span>
							</div>
						) : null}

						<button
							type="submit"
							disabled={submitting}
							className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Send size={14} />
							{submitting ? "Submitting..." : "Submit Inquiry"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
