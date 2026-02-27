import { createContext, useContext, useState, useEffect } from "react";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

	const register = async (email, password, businessName, ownerName) => {
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		await updateProfile(cred.user, { displayName: ownerName });
		await setDoc(doc(db, "users", cred.user.uid), {
			email,
			ownerName,
			businessName,
			createdAt: serverTimestamp(),
			plan: "free",
		});
		setUserProfile({ email, ownerName, businessName, plan: "free" });
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
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
