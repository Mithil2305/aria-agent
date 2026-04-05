import { useState } from "react";
import {
	Mail,
	Phone,
	Building2,
	Clock3,
	Send,
	CheckCircle2,
	AlertCircle,
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
		<div className="min-h-screen bg-slate-50 px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						Contact Us
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						Let's build better decisions together.
					</h1>
					<p className="mt-4 max-w-4xl text-base leading-relaxed text-slate-600">
						If you're evaluating Yukti, exploring a partnership, or want to
						discuss enterprise rollout, we'd love to hear from you.
					</p>
				</div>

				<div className="mt-8 grid gap-5 md:grid-cols-3">
					{channels.map((channel) => {
						const Icon = channel.icon;
						return (
							<div
								key={channel.title}
								className="rounded-2xl border border-slate-200 bg-white p-5"
							>
								<div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
									<Icon size={16} />
								</div>
								<h2 className="text-base font-bold text-slate-900">
									{channel.title}
								</h2>
								<p className="mt-2 text-sm text-slate-600">
									{channel.description}
								</p>
								<a
									href={`mailto:${channel.email}`}
									className="mt-3 inline-block text-sm font-semibold text-slate-900 hover:text-slate-600"
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
					<div className="rounded-2xl border border-slate-200 bg-white p-6">
						<h2 className="text-2xl font-bold text-slate-900">Visit our HQ</h2>
						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
							<p className="font-semibold text-slate-900">
								Mud Media Technologies Pvt. Ltd.
							</p>
							<p className="mt-1">6th Floor, Orbit Tech Park</p>
							<p>Outer Ring Road, Bellandur</p>
							<p>Bengaluru, Karnataka 560103</p>
							<p>India</p>
						</div>
						<div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
							<Building2 size={15} />
							Mon-Fri, 10:00 AM - 6:30 PM IST
						</div>
					</div>

					<form
						onSubmit={handleSubmit}
						className="rounded-2xl border border-slate-200 bg-white p-6"
					>
						<h2 className="text-2xl font-bold text-slate-900">
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
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
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
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
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
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
								/>
								{errors.companyName && (
									<p className="mt-1 text-xs text-red-600">
										{errors.companyName}
									</p>
								)}
							</div>

							<div>
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Business Type *
								</label>
								<select
									name="businessType"
									value={formData.businessType}
									onChange={handleChange}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
								>
									<option value="">Select business type</option>
									{BUSINESS_TYPES.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.businessType && (
									<p className="mt-1 text-xs text-red-600">
										{errors.businessType}
									</p>
								)}
							</div>

							<div>
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Revenue Scale *
								</label>
								<select
									name="revenueScale"
									value={formData.revenueScale}
									onChange={handleChange}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
								>
									<option value="">Select revenue scale</option>
									{REVENUE_SCALES.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.revenueScale && (
									<p className="mt-1 text-xs text-red-600">
										{errors.revenueScale}
									</p>
								)}
							</div>

							<div>
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Team Size
								</label>
								<input
									name="teamSize"
									value={formData.teamSize}
									onChange={handleChange}
									placeholder="e.g. 10-25"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
								/>
							</div>

							<div>
								<label className="mb-1 block text-xs font-semibold text-slate-600">
									Purpose of Inquiry *
								</label>
								<select
									name="purpose"
									value={formData.purpose}
									onChange={handleChange}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
								>
									<option value="">Select purpose</option>
									{PURPOSES.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.purpose && (
									<p className="mt-1 text-xs text-red-600">{errors.purpose}</p>
								)}
							</div>

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
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
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
							className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
