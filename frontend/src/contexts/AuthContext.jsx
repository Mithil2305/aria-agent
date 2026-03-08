import { createContext, useContext, useState, useEffect } from "react";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	updateProfile,
} from "firebase/auth";
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);
			if (firebaseUser) {
				try {
					const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
					if (profileDoc.exists()) {
						setUserProfile(profileDoc.data());
					}
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
		const profile = {
			email,
			ownerName,
			businessName: profileData.businessName || "",
			businessType: profileData.businessType || "",
			phone: profileData.phone || "",
			address: profileData.address || "",
			currency: profileData.currency || "INR",
			createdAt: serverTimestamp(),
			plan: "free",
			role: "free-tier",
			trialStartDate: serverTimestamp(),
		};
		await setDoc(doc(db, "users", cred.user.uid), profile);
		setUserProfile(profile);
		return cred.user;
	};

	const login = async (email, password) => {
		const cred = await signInWithEmailAndPassword(auth, email, password);
		return cred.user;
	};

	const logout = async () => {
		await signOut(auth);
		setUser(null);
		setUserProfile(null);
	};

	const getIdToken = async () => {
		if (!user) return null;
		return user.getIdToken();
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
