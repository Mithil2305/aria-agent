import { create } from "zustand";

export const useNewsStore = create((set) => ({
	keywords: ["supply chain", "inflation"],
	setKeywords: (keywords) => set({ keywords }),
}));
