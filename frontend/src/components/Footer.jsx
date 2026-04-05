import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Github, Mail, ArrowRight } from "lucide-react";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	const footerLinks = {
		product: [
			{ label: "Features", to: "/documentation" },
			{ label: "Integrations", to: "/integrations" },
			{ label: "Pricing", to: "/pricing" },
			{ label: "Changelog", to: "/documentation" },
			{ label: "Security", to: "/documentation" },
		],
		resources: [
			{ label: "Documentation", to: "/documentation" },
			{ label: "Blog", to: "/documentation" },
			{ label: "Case Studies", to: "/case-studies" },
			{ label: "Help Center", to: "/help-center" },
			{ label: "API Reference", to: "/api-reference" },
		],
		company: [
			{ label: "About Mud Media", to: "/about-mud-media" },
			{ label: "Careers", to: "/careers" },
			{ label: "Contact Us", to: "/contact-us" },
			{ label: "Privacy Policy", to: "/privacy-policy" },
			{ label: "Terms of Service", to: "/terms-of-service" },
		],
	};

	return (
		<footer className="bg-white border-t border-slate-200 pt-20 pb-10 px-6 lg:px-8 relative z-10">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
					{/* Brand Section */}
					<div className="lg:col-span-4 flex flex-col items-start">
						<div className="flex items-center gap-3 mb-6 cursor-pointer group">
							<div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-95 transition-transform duration-300">
								<span className="text-white font-bold text-xl leading-none">
									Y
								</span>
							</div>
							<span className="font-bold text-2xl tracking-tight text-slate-900">
								Yukti
							</span>
						</div>
						<p className="text-slate-500 leading-relaxed mb-8 max-w-sm">
							The intelligent analytics platform purpose-built for Indian SMBs.
							Stop guessing and start making data-driven decisions today.
						</p>

						{/* Newsletter Subscribe */}
						<div className="w-full max-w-sm mb-8">
							<p className="text-sm font-semibold text-slate-900 mb-3">
								Subscribe to our newsletter
							</p>
							<div className="flex gap-2">
								<input
									type="email"
									placeholder="Enter your email"
									className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
								/>
								<button className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center">
									<ArrowRight size={18} />
								</button>
							</div>
						</div>

						{/* Social Links */}
						<div className="flex items-center gap-4">
							{[
								{ icon: Twitter, href: "#", label: "Twitter" },
								{ icon: Linkedin, href: "#", label: "LinkedIn" },
								{ icon: Github, href: "#", label: "GitHub" },
								{
									icon: Mail,
									href: "mailto:hello@mudmedia.in",
									label: "Email",
								},
							].map((social, index) => (
								<a
									key={index}
									href={social.href}
									aria-label={social.label}
									className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-black hover:border-black hover:text-white transition-all duration-300 hover:-translate-y-1"
								>
									<social.icon size={18} />
								</a>
							))}
						</div>
					</div>

					{/* Links Sections */}
					<div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 lg:pl-12">
						<div>
							<h3 className="font-semibold text-slate-900 mb-5">Product</h3>
							<ul className="space-y-4">
								{footerLinks.product.map((link) => (
									<li key={link.label}>
										<Link
											to={link.to}
											className="text-slate-500 hover:text-black text-sm font-medium transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
						<div>
							<h3 className="font-semibold text-slate-900 mb-5">Resources</h3>
							<ul className="space-y-4">
								{footerLinks.resources.map((link) => (
									<li key={link.label}>
										<Link
											to={link.to}
											className="text-slate-500 hover:text-black text-sm font-medium transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
						<div className="col-span-2 md:col-span-1">
							<h3 className="font-semibold text-slate-900 mb-5">Company</h3>
							<ul className="space-y-4">
								{footerLinks.company.map((link) => (
									<li key={link.label}>
										<Link
											to={link.to}
											className="text-slate-500 hover:text-black text-sm font-medium transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-sm text-slate-500 font-medium">
						© {currentYear} Mud Media. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
