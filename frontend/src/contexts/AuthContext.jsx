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
} from "firebase/auth";
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	deleteField,
	serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);
const ADMIN_EMAIL = "admin@yukti.com";

function isAdminEmail(email) {
	return (
		String(email || "")
			.trim()
			.toLowerCase() === ADMIN_EMAIL
	);
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
	const [loading, setLoading] = useState(true);
	const googleProvider = new GoogleAuthProvider();
	googleProvider.setCustomParameters({ prompt: "select_account" });

	const ensureUserProfileDoc = async (firebaseUser, profileData = {}) => {
		if (!firebaseUser) return null;
		const adminUser = isAdminEmail(firebaseUser.email);

		const ref = doc(db, "users", firebaseUser.uid);
		const snap = await getDoc(ref);

		if (!snap.exists()) {
			const profile = {
				email: firebaseUser.email || "",
				ownerName:
					profileData.ownerName ||
					firebaseUser.displayName ||
					firebaseUser.email?.split("@")[0] ||
					"",
				businessName: profileData.businessName || "",
				businessType: profileData.businessType || "",
				phone: profileData.phone || firebaseUser.phoneNumber || "",
				address: profileData.address || "",
				currency: profileData.currency || "INR",
				createdAt: serverTimestamp(),
				role: adminUser ? "admin" : "free-tier",
				trialStartDate: adminUser ? null : serverTimestamp(),
			};
			await setDoc(ref, profile);
			setUserProfile(profile);
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

		setUserProfile({ ...existing, ...patch });
		return { ...existing, ...patch };
	};

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);
			if (firebaseUser) {
				try {
					await ensureUserProfileDoc(firebaseUser);
				} catch {
					setUserProfile(null);
				}
			} else {
				setUserProfile(null);
			}
			setLoading(false);
		});
		return unsub;
	}, []);

	const register = async (email, password, profileData = {}) => {
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		const ownerName = profileData.ownerName || "";
		await updateProfile(cred.user, { displayName: ownerName });
		await sendEmailVerification(cred.user);
		const profile = {
			email,
			ownerName,
			businessName: profileData.businessName || "",
			businessType: profileData.businessType || "",
			phone: profileData.phone || "",
			address: profileData.address || "",
			currency: profileData.currency || "INR",
			createdAt: serverTimestamp(),
			role: "free-tier",
			trialStartDate: serverTimestamp(),
		};
		await setDoc(doc(db, "users", cred.user.uid), profile);
		setUserProfile(profile);
		await signOut(auth);
		return cred.user;
	};

	const login = async (email, password) => {
		const cred = await signInWithEmailAndPassword(auth, email, password);
		await reload(cred.user);
		const adminUser = isAdminEmail(cred.user.email);
		if (!cred.user.emailVerified && !adminUser) {
			await signOut(auth);
			const err = new Error("Email not verified");
			err.code = "auth/email-not-verified";
			throw err;
		}
		return cred.user;
	};

	const resendVerificationEmail = async (email, password) => {
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

	const continueWithGoogle = async (profileData = {}) => {
		const cred = await signInWithPopup(auth, googleProvider);
		await ensureUserProfileDoc(cred.user, profileData);
		return cred.user;
	};

	const loginWithGoogle = async () => continueWithGoogle();

	const registerWithGoogle = async (profileData = {}) =>
		continueWithGoogle(profileData);

	const logout = async () => {
		await signOut(auth);
		setUser(null);
		setUserProfile(null);
	};

	const getIdToken = useCallback(async () => {
		if (!user) return null;
		return user.getIdToken();
	}, [user]);

	const updateUserProfile = async (updates) => {
		if (!user) return;
		await updateDoc(doc(db, "users", user.uid), {
			...updates,
			updatedAt: serverTimestamp(),
		});
		if (updates.ownerName) {
			await updateProfile(user, { displayName: updates.ownerName });
		}
		setUserProfile((prev) => ({ ...prev, ...updates }));
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
				register,
				login,
				loginWithGoogle,
				resendVerificationEmail,
				registerWithGoogle,
				logout,
				getIdToken,
				updateUserProfile,
				getTrialStatus,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
