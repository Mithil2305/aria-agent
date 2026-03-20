import { useState, useRef, useEffect } from "react";
import {
	MessageCircle,
	Send,
	Sparkles,
	Loader2,
	TrendingUp,
	ChevronRight,
	Zap,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { saveSectionReport } from "../services/reportMemory";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SUGGESTED_QUESTIONS = [
	"Which day has the lowest sales?",
	"What is my profit margin?",
	"How many customers do I get per day?",
	"Which product makes the most profit?",
	"What is my weekly revenue trend?",
	"How can I increase my sales?",
];

export default function BusinessChat({ token, category, analysisReady }) {
	const { user } = useAuth();
	const [messages, setMessages] = useState([
		{
			role: "assistant",
			text: "Ask me anything about your business! I can answer questions about your sales, profit, customers, and give you specific recommendations.",
			type: "intro",
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const bottomRef = useRef(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const askQuestion = async (question) => {
		if (!question.trim()) return;

		const q = question.trim();
		setMessages((prev) => [...prev, { role: "user", text: q }]);
		setInput("");
		setLoading(true);

		try {
			const { data } = await axios.post(
				`${API_BASE}/api/chat`,
				{ question: q, category: category || "general" },
				{ headers: token ? { Authorization: `Bearer ${token}` } : {} },
			);
			const ans = data.answer || {};
			saveSectionReport(user, "business_chat", {
				summary: `Q: ${q}`,
				top_issue: ans.answer || null,
				action: ans.action || null,
				trend: ans.confidence || null,
			}).catch(() => {});
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text:
						ans.answer ||
						"I couldn't find a clear answer. Try asking with more specific terms.",
					highlight: ans.highlight,
					action: ans.action,
					confidence: ans.confidence,
					type: "answer",
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: "I couldn't process that question right now. Please try again or run an analysis first.",
					type: "error",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!loading) askQuestion(input);
	};

	return (
		<div className="card flex flex-col" style={{ height: "480px" }}>
			{/* Header */}
			<div className="px-5 py-4 border-b border-surface-200 flex items-center gap-2 shrink-0">
				<div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
					<MessageCircle size={16} className="text-indigo-600" />
				</div>
				<div>
					<h3 className="text-sm font-semibold text-surface-900">Ask Yukti</h3>
					<p className="text-[10px] text-surface-400">
						Ask anything about your business
					</p>
				</div>
				{!analysisReady && (
					<span className="ml-auto text-[10px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
						Run analysis first
					</span>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
				{messages.map((msg, i) => (
					<div
						key={i}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						{msg.role === "assistant" && (
							<div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 mr-2">
								<Sparkles size={12} className="text-indigo-600" />
							</div>
						)}
						<div
							className={`max-w-[82%] space-y-2 ${
								msg.role === "user"
									? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5"
									: "space-y-2"
							}`}
						>
							<p
								className={`text-sm leading-relaxed ${
									msg.role === "user" ? "text-white" : "text-surface-800"
								}`}
							>
								{msg.text}
							</p>

							{/* Highlight stat */}
							{msg.highlight && (
								<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
									<TrendingUp size={13} className="text-indigo-500 shrink-0" />
									<span className="text-sm font-bold text-indigo-700">
										{msg.highlight}
									</span>
								</div>
							)}

							{/* Action recommendation */}
							{msg.action && (
								<div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
									<Zap size={12} className="text-amber-500 shrink-0 mt-0.5" />
									<p className="text-xs text-amber-800 font-medium leading-relaxed">
										{msg.action}
									</p>
								</div>
							)}

							{/* Suggested follow-ups for intro */}
							{msg.type === "intro" && (
								<div className="flex flex-wrap gap-1.5 mt-2">
									{SUGGESTED_QUESTIONS.slice(0, 3).map((q, qi) => (
										<button
											key={qi}
											onClick={() => askQuestion(q)}
											disabled={loading}
											className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all font-medium"
										>
											{q}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				))}

				{loading && (
					<div className="flex justify-start">
						<div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 mr-2">
							<Sparkles size={12} className="text-indigo-600" />
						</div>
						<div className="px-4 py-3 rounded-2xl bg-surface-100 border border-surface-200">
							<div className="flex items-center gap-1.5">
								<div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
								<div
									className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
									style={{ animationDelay: "0.1s" }}
								/>
								<div
									className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
									style={{ animationDelay: "0.2s" }}
								/>
							</div>
						</div>
					</div>
				)}
				<div ref={bottomRef} />
			</div>

			{/* Suggested questions */}
			<div className="px-4 py-2 border-t border-surface-100 overflow-x-auto shrink-0">
				<div className="flex gap-2 min-w-max">
					{SUGGESTED_QUESTIONS.map((q, i) => (
						<button
							key={i}
							onClick={() => !loading && askQuestion(q)}
							disabled={loading}
							className="text-[11px] px-2.5 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-surface-600 hover:border-indigo-300 hover:text-indigo-600 transition-all whitespace-nowrap disabled:opacity-50"
						>
							{q}
						</button>
					))}
				</div>
			</div>

			{/* Input */}
			<form
				onSubmit={handleSubmit}
				className="px-4 py-3 border-t border-surface-200 shrink-0"
			>
				<div className="flex items-center gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask about your sales, profit, customers…"
						className="input-field flex-1 text-sm py-2"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading || !input.trim()}
						className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40"
					>
						{loading ? (
							<Loader2 size={15} className="animate-spin" />
						) : (
							<Send size={15} />
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
