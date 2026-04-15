import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import HomeAmbientBackground from "../components/home/HomeAmbientBackground";
import HomeHeroSection from "../components/home/HomeHeroSection";
import {
	buildPath,
	CTA_VARIANTS,
	TREND_SERIES,
} from "../components/home/constants";

const HomeTickerSection = lazy(
	() => import("../components/home/HomeTickerSection"),
);
const HomeProblemSolutionSection = lazy(
	() => import("../components/home/HomeProblemSolutionSection"),
);
const HomeSuperpowersSection = lazy(
	() => import("../components/home/HomeSuperpowersSection"),
);
const HomePipelineSection = lazy(
	() => import("../components/home/HomePipelineSection"),
);
const HomeTargetUsersSection = lazy(
	() => import("../components/home/HomeTargetUsersSection"),
);
const HomeValueDecisionSection = lazy(
	() => import("../components/home/HomeValueDecisionSection"),
);
const HomeFinalCtaSection = lazy(
	() => import("../components/home/HomeFinalCtaSection"),
);

const trackLandingCtaClick = (data) => console.log("Analytics Event:", data);

function SectionFallback() {
	return <div className="h-20" aria-hidden="true" />;
}

export default function HomePage() {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();

	const [ctaVariantKey] = useState(() => {
		const saved = localStorage.getItem("yukti_cta_variant");

		if (saved === "A" || saved === "B") return saved;
		const picked = Math.random() > 0.5 ? "B" : "A";
		localStorage.setItem("yukti_cta_variant", picked);
		return picked;
	});

	const activeVariant = useMemo(
		() => CTA_VARIANTS[ctaVariantKey] || CTA_VARIANTS.A,
		[ctaVariantKey],
	);

	const beforePath = useMemo(() => buildPath(TREND_SERIES.before), []);
	const afterPath = useMemo(() => buildPath(TREND_SERIES.after), []);

	const trackCta = (target, location, label) => {
		trackLandingCtaClick({ variant: ctaVariantKey, target, location, label });
	};

	const onHeroPrimaryClick = () => {
		trackCta("live", "hero_primary", activeVariant.heroPrimary);
		navigate("/register");
	};

	const onHeroSecondaryClick = () => {
		trackCta("demo", "hero_secondary", activeVariant.heroSecondary);
		navigate("/contact-us");
	};

	const onFinalPrimaryClick = () => {
		trackCta("live", "final_primary", activeVariant.finalPrimary);

		navigate("/register");
	};

	const onConsultationClick = () => {
		trackCta("consultation", "final_secondary", "Book a Consultation");
		navigate("/register");
	};

	return (
		<div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-black selection:text-white font-sans relative overflow-x-hidden">
			<HomeAmbientBackground prefersReducedMotion={prefersReducedMotion} />

			<HomeHeroSection
				activeVariant={activeVariant}
				onPrimaryClick={onHeroPrimaryClick}
				onSecondaryClick={onHeroSecondaryClick}
			/>

			<Suspense fallback={<SectionFallback />}>
				<HomeTickerSection prefersReducedMotion={prefersReducedMotion} />
				<HomeProblemSolutionSection
					beforePath={beforePath}
					afterPath={afterPath}
				/>
				<HomeTargetUsersSection />
				<HomeSuperpowersSection />
				<HomePipelineSection />
				<HomeValueDecisionSection />
				<HomeFinalCtaSection
					activeVariant={activeVariant}
					onPrimaryClick={onFinalPrimaryClick}
					onConsultationClick={onConsultationClick}
				/>
			</Suspense>
		</div>
	);
}
