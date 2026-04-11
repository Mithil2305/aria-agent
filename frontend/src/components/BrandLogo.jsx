function joinClasses(...classes) {
	return classes.filter(Boolean).join(" ");
}

export default function BrandLogo({
	size = 32,
	showText = false,
	name = "Yukti",
	subtitle,
	className,
	markClassName,
	textClassName,
	subtitleClassName,
}) {
	return (
		<div className={joinClasses("inline-flex items-center gap-2.5", className)}>
			<img
				src="/logo.png"
				alt=""
				aria-hidden="true"
				width={size}
				height={size}
				className={joinClasses("shrink-0 object-contain", markClassName)}
			/>

			{showText ? (
				<div className="min-w-0">
					<p
						className={joinClasses(
							"font-semibold tracking-tight",
							textClassName,
						)}
					>
						{name}
					</p>
					{subtitle ? (
						<p className={joinClasses("text-[11px]", subtitleClassName)}>
							{subtitle}
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}
