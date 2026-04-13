import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
	signOut,
	onAuthStateChanged,
	updateProfile,
	sendEmailVerification,
	reload,
	getAdditionalUserInfo,
} from "firebase/auth";
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	deleteField,
	serverTimestamp,
} from "firebase/firestore";
import { auth, db, initFirebase } from "../firebase";
import { validateRegistrationEligibility } from "../services/api";

const AuthContext = createContext(null);
const ADMIN_EMAIL = "admin@yukti.com";
const PROFILE_CACHE_PREFIX = "yukti_profile_cache_";
const AUTH_MAX_WAIT_MS = 2500;

function isAdminEmail(email) {
	return (
		String(email || "")
			.trim()
			.toLowerCase() === ADMIN_EMAIL
	);
}

function readCachedProfile(uid) {
	if (!uid) return null;
	try {
		const raw = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${uid}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
}

function writeCachedProfile(uid, profile) {
	if (!uid || !profile) return;
	try {
		localStorage.setItem(
			`${PROFILE_CACHE_PREFIX}${uid}`,
			JSON.stringify(profile),
		);
	} catch {
		// Ignore localStorage failures
	}
}

function normalizeBusinessKey(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

function normalizePhoneKey(value) {
	const digits = String(value || "").replace(/\D/g, "");
	if (digits.length >= 10) return digits.slice(-10);
	return digits;
}

function normalizeGstKey(value) {
	return String(value || "")
		.toUpperCase()
		.replace(/[^0-9A-Z]/g, "");
}

async function assertRegistrationAllowed(profileData) {
	const payload = {
		email: String(profileData.email || "")
			.trim()
			.toLowerCase(),
		businessName: String(profileData.businessName || "").trim(),
		phone: String(profileData.phone || "").trim(),
		gst: String(profileData.gst || "").trim() || null,
	};

	const result = await validateRegistrationEligibility(payload);
	if (!result?.allow) {
		const err = new Error(
			result?.message ||
				"An account already exists for this business. Please sign in.",
		);
		err.code = "auth/business-already-registered";
		err.reason = result?.reason || "duplicate";
		throw err;
	}
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [authInitialized, setAuthInitialized] = useState(false);
	const [authBootRequested, setAuthBootRequested] = useState(false);
	const googleProvider = new GoogleAuthProvider();
	googleProvider.setCustomParameters({ prompt: "select_account" });

	const initAuthIfNeeded = useCallback(async () => {
		setAuthBootRequested(true);
		await initFirebase();
	}, []);

	const ensureUserProfileDoc = async (firebaseUser, profileData = {}) => {
		if (!firebaseUser) return null;
		const adminUser = isAdminEmail(firebaseUser.email);

		const ref = doc(db, "users", firebaseUser.uid);
		const snap = await getDoc(ref);

		if (!snap.exists()) {
			const email = firebaseUser.email || profileData.email || "";
			const businessName = profileData.businessName || "";
			const phone = profileData.phone || firebaseUser.phoneNumber || "";
			const gst = profileData.gst || "";
			const profile = {
				email,
				ownerName:
					profileData.ownerName ||
					firebaseUser.displayName ||
					firebaseUser.email?.split("@")[0] ||
					"",
				businessName,
				businessType: profileData.businessType || "",
				phone,
				gst,
				emailKey: String(email).trim().toLowerCase(),
				businessNameKey: normalizeBusinessKey(businessName),
				phoneKey: normalizePhoneKey(phone),
				gstKey: normalizeGstKey(gst),
				address: profileData.address || "",
				currency: profileData.currency || "INR",
				createdAt: serverTimestamp(),
				role: adminUser ? "admin" : "free-tier",
				trialStartDate: adminUser ? null : serverTimestamp(),
			};
			await setDoc(ref, profile);
			setUserProfile(profile);
			writeCachedProfile(firebaseUser.uid, profile);
			return profile;
		}

		const existing = snap.data();
		const patch = {};
		if (
			!existing.ownerName &&
			(profileData.ownerName || firebaseUser.displayName)
		) {
			patch.ownerName = profileData.ownerName || firebaseUser.displayName;
		}
		if (!existing.phone && (profileData.phone || firebaseUser.phoneNumber)) {
			patch.phone = profileData.phone || firebaseUser.phoneNumber;
		}
		if (!existing.gst && profileData.gst) {
			patch.gst = profileData.gst;
		}
		if (!existing.businessName && profileData.businessName) {
			patch.businessName = profileData.businessName;
		}
		if (!existing.businessType && profileData.businessType) {
			patch.businessType = profileData.businessType;
		}
		if (!existing.address && profileData.address) {
			patch.address = profileData.address;
		}
		if (!existing.currency && profileData.currency) {
			patch.currency = profileData.currency;
		}
		if (!existing.emailKey && firebaseUser.email) {
			patch.emailKey = String(firebaseUser.email).trim().toLowerCase();
		}
		if (
			!existing.businessNameKey &&
			(existing.businessName || profileData.businessName)
		) {
			patch.businessNameKey = normalizeBusinessKey(
				existing.businessName || profileData.businessName,
			);
		}
		if (
			!existing.phoneKey &&
			(existing.phone || profileData.phone || firebaseUser.phoneNumber)
		) {
			patch.phoneKey = normalizePhoneKey(
				existing.phone || profileData.phone || firebaseUser.phoneNumber,
			);
		}
		if (!existing.gstKey && (existing.gst || profileData.gst)) {
			patch.gstKey = normalizeGstKey(existing.gst || profileData.gst);
		}
		if (adminUser && existing.role !== "admin") {
			patch.role = "admin";
		}
		if (Object.prototype.hasOwnProperty.call(existing, "plan")) {
			patch.plan = deleteField();
		}

		if (Object.keys(patch).length > 0) {
			await updateDoc(ref, {
				...patch,
				updatedAt: serverTimestamp(),
			});
		}

		const merged = { ...existing, ...patch };
		setUserProfile(merged);
		writeCachedProfile(firebaseUser.uid, merged);
		return merged;
	};

	useEffect(() => {
		if (!authBootRequested) return;

		let unsub = null;
		let cancelled = false;
		setLoading(true);

		(async () => {
			try {
				await initFirebase();
			} catch {
				if (!cancelled) {
					setUser(null);
					setUserProfile(null);
					setAuthInitialized(true);
					setLoading(false);
				}
				return;
			}

			if (!auth) {
				if (!cancelled) {
					setAuthInitialized(true);
					setLoading(false);
				}
				return;
			}

			unsub = onAuthStateChanged(auth, async (firebaseUser) => {
				setUser(firebaseUser);
				let loadingSettled = false;
				const settleLoading = () => {
					if (loadingSettled) return;
					loadingSettled = true;
					setLoading(false);
				};
				const maxWaitTimer = setTimeout(settleLoading, AUTH_MAX_WAIT_MS);

				if (firebaseUser) {
					const cached = readCachedProfile(firebaseUser.uid);
					if (cached) {
						setUserProfile(cached);
						settleLoading();
					}
					try {
						await ensureUserProfileDoc(firebaseUser);
					} catch {
						if (!cached) setUserProfile(null);
					}
				} else {
					setUserProfile(null);
				}

				clearTimeout(maxWaitTimer);
				if (!authInitialized) {
					setAuthInitialized(true);
				}
				settleLoading();
			});
		})();

		return () => {
			cancelled = true;
			if (typeof unsub === "function") unsub();
		};
	}, [authBootRequested, authInitialized]);

	const register = async (email, password, profileData = {}) => {
		await initAuthIfNeeded();
		await assertRegistrationAllowed({ ...profileData, email });

		const cred = await createUserWithEmailAndPassword(auth, email, password);
		const ownerName = profileData.ownerName || "";
		const businessName = profileData.businessName || "";
		const phone = profileData.phone || "";
		const gst = profileData.gst || "";
		await updateProfile(cred.user, { displayName: ownerName });
		await sendEmailVerification(cred.user);
		const profile = {
			email,
			ownerName,
			businessName,
			businessType: profileData.businessType || "",
			phone,
			gst,
			emailKey: String(email || "")
				.trim()
				.toLowerCase(),
			businessNameKey: normalizeBusinessKey(businessName),
			phoneKey: normalizePhoneKey(phone),
			gstKey: normalizeGstKey(gst),
			address: profileData.address || "",
			currency: profileData.currency || "INR",
			createdAt: serverTimestamp(),
			role: "free-tier",
			trialStartDate: serverTimestamp(),
		};
		await setDoc(doc(db, "users", cred.user.uid), profile);
		setUserProfile(profile);
		await reload(cred.user);
		setUser({ ...cred.user });
		return cred.user;
	};

	const login = async (email, password) => {
		await initAuthIfNeeded();
		const cred = await signInWithEmailAndPassword(auth, email, password);
		await reload(cred.user);
		return cred.user;
	};

	const resendVerificationEmail = async (email, password) => {
		await initAuthIfNeeded();
		const cred = await signInWithEmailAndPassword(auth, email, password);
		await reload(cred.user);
		if (cred.user.emailVerified) {
			await signOut(auth);
			return { alreadyVerified: true };
		}
		await sendEmailVerification(cred.user);
		await signOut(auth);
		return { alreadyVerified: false };
	};

	const continueWithGoogle = async (profileData = {}, intent = "login") => {
		await initAuthIfNeeded();
		const cred = await signInWithPopup(auth, googleProvider);
		const isNewUser = getAdditionalUserInfo(cred)?.isNewUser === true;
		const email = cred.user.email || "";
		try {
			if (intent === "register") {
				if (!isNewUser) {
					const err = new Error(
						"An account already exists for this business. Please sign in to your existing account.",
					);
					err.code = "auth/business-already-registered";
					throw err;
				}
				await assertRegistrationAllowed({ ...profileData, email });
			}
			await ensureUserProfileDoc(cred.user, { ...profileData, email });
		} catch (error) {
			try {
				if (error?.code === "auth/business-already-registered" && isNewUser) {
					await cred.user.delete();
				}
			} catch {
				// Ignore cleanup failures and proceed with sign-out.
			}
			await signOut(auth).catch(() => {});
			throw error;
		}
		return cred.user;
	};

	const loginWithGoogle = async () => continueWithGoogle({}, "login");

	const registerWithGoogle = async (profileData = {}) =>
		continueWithGoogle(profileData, "register");

	const logout = async () => {
		await initAuthIfNeeded();
		await signOut(auth);
		setUser(null);
		setUserProfile(null);
	};

	const getIdToken = useCallback(async () => {
		await initAuthIfNeeded();
		if (!user) return null;
		return user.getIdToken();
	}, [initAuthIfNeeded, user]);

	const resendVerificationForCurrentUser = async () => {
		await initAuthIfNeeded();
		if (!auth.currentUser) {
			throw new Error("No signed-in user found.");
		}
		await sendEmailVerification(auth.currentUser);
	};

	const refreshEmailVerification = async () => {
		await initAuthIfNeeded();
		if (!auth.currentUser) return false;
		await reload(auth.currentUser);
		setUser({ ...auth.currentUser });
		return !!auth.currentUser.emailVerified;
	};

	const updateUserProfile = async (updates) => {
		if (!user) return;
		await updateDoc(doc(db, "users", user.uid), {
			...updates,
			updatedAt: serverTimestamp(),
		});
		if (updates.ownerName) {
			await updateProfile(user, { displayName: updates.ownerName });
		}
		setUserProfile((prev) => {
			const next = { ...prev, ...updates };
			writeCachedProfile(user.uid, next);
			return next;
		});
	};

	/**
	 * Compute free-tier trial status from the user profile.
	 * Returns { isFreeTier, isTrialExpired, daysLeft, trialStartDate }
	 */
	const getTrialStatus = () => {
		if (!userProfile)
			return { isFreeTier: false, isTrialExpired: false, daysLeft: 0 };

		const role = userProfile.role || "paid-user";
		if (role !== "free-tier") {
			return { isFreeTier: false, isTrialExpired: false, daysLeft: Infinity };
		}

		// trialStartDate may be a Firestore Timestamp or a JS Date or missing
		let start = userProfile.trialStartDate;
		if (!start) {
			// Fallback to createdAt for users created before this feature
			start = userProfile.createdAt;
		}
		if (!start) {
			return { isFreeTier: true, isTrialExpired: true, daysLeft: 0 };
		}

		// Convert Firestore Timestamp → Date
		const startDate = start?.toDate ? start.toDate() : new Date(start);
		const now = new Date();
		const elapsed = now - startDate;
		const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
		const daysLeft = Math.max(
			0,
			Math.ceil((SEVEN_DAYS - elapsed) / (1000 * 60 * 60 * 24)),
		);

		return {
			isFreeTier: true,
			isTrialExpired: elapsed >= SEVEN_DAYS,
			daysLeft,
			trialStartDate: startDate,
		};
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				userProfile,
				loading,
				authInitialized,
				register,
				login,
				loginWithGoogle,
				resendVerificationEmail,
				registerWithGoogle,
				logout,
				initAuthIfNeeded,
				getIdToken,
				resendVerificationForCurrentUser,
				refreshEmailVerification,
				updateUserProfile,
				getTrialStatus,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
