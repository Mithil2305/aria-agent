import { Link, useLocation } from "react-router-dom";

const marketingLinks = [
	{ label: "About", to: "/about" },
	{ label: "Pricing", to: "/pricing" },
	{ label: "Contact", to: "/contact-us" },
	{ label: "Docs", to: "/documentation" },
	{ label: "Help Center", to: "/help-center" },
	{ label: "Careers", to: "/careers" },
];

export default function Navbar() {
	const location = useLocation();

	const isActive = (path) => {
		if (path === "/") return location.pathname === "/";
		return location.pathname.startsWith(path);
	};

	return (
		<header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
			<nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-6 py-3 lg:px-8">
				<Link to="/" className="group flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
						<span className="text-base font-bold leading-none">Y</span>
					</div>
					<span className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-slate-700">
						Yukti
					</span>
				</Link>

				<div className="hidden items-center gap-4 xl:flex">
					{marketingLinks.map((link) => (
						<Link
							key={link.to}
							to={link.to}
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

				<div className="flex items-center gap-3">
					<Link
						to="/login"
						className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
					>
						Log in
					</Link>
					<Link
						to="/register"
						className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
					>
						Try Yukti
					</Link>
				</div>
			</nav>
		</header>
	);
}
