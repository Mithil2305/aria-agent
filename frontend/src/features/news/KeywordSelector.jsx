import { useMemo, useState } from "react";

const QUICK = [
	"supply chain",
	"inflation",
	"interest rates",
	"consumer spending",
	"energy prices",
	"currency",
];

export default function KeywordSelector({ value, onChange }) {
	const [draft, setDraft] = useState("");
	const selected = useMemo(() => value || [], [value]);

	const addKeyword = (raw) => {
		const keyword = String(raw || "")
			.trim()
			.toLowerCase();
		if (!keyword) return;
		if (selected.includes(keyword)) return;
		if (selected.length >= 10) return;
		onChange([...selected, keyword]);
		setDraft("");
	};

	const removeKeyword = (item) => {
		onChange(selected.filter((key) => key !== item));
	};

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
			<div className="flex flex-wrap gap-2">
				{selected.map((item) => (
					<button
						key={item}
						type="button"
						onClick={() => removeKeyword(item)}
						className="px-2.5 py-1 text-xs rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
					>
						{item} x
					</button>
				))}
			</div>

			<div className="flex gap-2">
				<input
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							addKeyword(draft);
						}
					}}
					placeholder="Add keyword"
					className="flex-1 h-9 rounded-lg border border-slate-300 px-3 text-sm"
				/>
				<button
					type="button"
					onClick={() => addKeyword(draft)}
					className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm"
				>
					Add
				</button>
			</div>

			<div className="flex flex-wrap gap-2">
				{QUICK.map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => addKeyword(option)}
						className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
					>
						+ {option}
					</button>
				))}
			</div>
		</div>
	);
}
