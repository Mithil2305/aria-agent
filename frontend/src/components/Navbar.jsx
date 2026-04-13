import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import BrandLogo from "./BrandLogo";

const marketingLinks = [
	{ label: "About", to: "/about" },
	{ label: "Pricing", to: "/pricing" },
	{ label: "Contact", to: "/contact-us" },
	{ label: "Help Center", to: "/help-center" },
	{ label: "Docs", to: "/documentation" },
	{ label: "Blogs", to: "/blogs" },
];

export default function Navbar() {
	const location = useLocation();
	const [mobileOpen, setMobileOpen] = useState(false);

	const closeMobileMenu = () => setMobileOpen(false);

	const isActive = (path) => {
		if (path === "/") return location.pathname === "/";
		return location.pathname.startsWith(path);
	};

	return (
		<header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
			<nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between gap-3">
					<Link
						to="/"
						onClick={closeMobileMenu}
						className="group flex items-center gap-2"
					>
						<img src="/yukti.png" alt="yukti logo" className="h-8 w-8" />
						<span className="text-lg font-bold text-slate-900 group-hover:text-slate-700">
							Yukti
						</span>
					</Link>

					<div className="hidden items-center gap-7 lg:flex">
						{marketingLinks.map((link) => (
							<Link
								key={link.to}
								to={link.to}
								onClick={closeMobileMenu}
								className={`text-sm font-medium transition-colors ${
									isActive(link.to)
										? "text-slate-900"
										: "text-slate-500 hover:text-slate-800"
								}`}
							>
								{link.label}
							</Link>
						))}
					</div>

					<div className="hidden items-center gap-4 sm:flex">
						<Link
							to="/login"
							onClick={closeMobileMenu}
							className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-full px-4 py-2 hover:bg-slate-100"
						>
							Log in
						</Link>
						<Link
							to="/register"
							onClick={closeMobileMenu}
							className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
						>
							Try Yukti
						</Link>
					</div>

					<button
						type="button"
						onClick={() => setMobileOpen((prev) => !prev)}
						className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:hidden"
						aria-label="Toggle navigation menu"
						aria-expanded={mobileOpen}
					>
						{mobileOpen ? <X size={18} /> : <Menu size={18} />}
					</button>
				</div>

				{mobileOpen && (
					<div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:hidden">
						<div className="flex flex-col">
							{marketingLinks.map((link) => (
								<Link
									key={link.to}
									to={link.to}
									onClick={closeMobileMenu}
									className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
										isActive(link.to)
											? "bg-slate-100 text-slate-900"
											: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
									}`}
								>
									{link.label}
								</Link>
							))}
						</div>

						<div className="my-3 h-px bg-slate-200" />

						<div className="grid grid-cols-2 gap-2">
							<Link
								to="/login"
								onClick={closeMobileMenu}
								className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Log in
							</Link>
							<Link
								to="/register"
								onClick={closeMobileMenu}
								className="rounded-lg bg-black px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
							>
								Try Yukti
							</Link>
						</div>
					</div>
				)}
			</nav>
		</header>
	);
}
