'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, PlusCircle, Bot, Send, MessageSquare, FileText, Download } from 'lucide-react';
import { ApiResponse } from '@/src/types/ApiResponse';

// ─── TYPES ────────────────────────────────────────────────
interface Message {
    role: "user" | "assistant";
    content: string;
    stage?: string;
    timestamp?: string;
}

interface ChatSession {
    sessionId: string;
    title: string;
    createdAt: string;
}

type ChatStatus = "questioning" | "complete" | "idle";

// ─── COMPONENT ────────────────────────────────────────────
const ChatbotPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [sessionList, setSessionList] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");

    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingMessage, setIsLoadingMessage] = useState(false);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ─── AUTH GUARD ───────────────────────────────────────
    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/signIn");
        }
    }, [status, router]);

    // ─── FETCH SESSION LIST ON LOAD ───────────────────────
    useEffect(() => {
        if (status === "authenticated") {
            fetchSessionList();
        }
    }, [status]);

    // ─── AUTO SCROLL ──────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoadingMessage]);

    // ─── FETCH SESSION LIST ───────────────────────────────
    const fetchSessionList = useCallback(async () => {
        setIsLoadingList(true);
        try {
            const response = await axios.get<ApiResponse & { sessions: ChatSession[] }>('/api/chat/sessions');
            if (response.data.success) {
                setSessionList(response.data.sessions);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to fetch chats.");
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    // ─── CREATE NEW SESSION ───────────────────────────────
    const handleNewChat = async () => {
        setIsCreatingSession(true);
        try {
            const response = await axios.post<ApiResponse & { sessionId: string; isFirstSession: boolean }>('/api/chat/new');
            if (response.data.success) {
                await fetchSessionList();
                setActiveSessionId(response.data.sessionId);
                setMessages([]);
                setChatStatus("idle");
                setTimeout(() => inputRef.current?.focus(), 100);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to create new chat.");
        } finally {
            setIsCreatingSession(false);
        }
    };

    // ─── CLICK SESSION → LOAD HISTORY ────────────────────
    const handleSessionClick = async (sessionId: string) => {
        if (sessionId === activeSessionId) return;

        setActiveSessionId(sessionId);
        setMessages([]);
        setChatStatus("idle");
        setIsLoadingHistory(true);

        try {
            const response = await axios.get<ApiResponse & {
                messages: Message[];
                status: string;
            }>(`/api/chat/history?sessionId=${sessionId}`);

            if (response.data.success) {
                // Map HF message shape to local Message shape
                const mapped: Message[] = (response.data.messages || []).map((m: any) => ({
                    role: m.role as "user" | "assistant",
                    content: m.message,
                    stage: m.stage,
                    timestamp: m.timestamp,
                }));
                setMessages(mapped);
                if (response.data.status === "completed") {
                    setChatStatus("complete");
                } else if (mapped.length > 0) {
                    setChatStatus("questioning");
                }
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to fetch chat history.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // ─── DELETE SESSION ───────────────────────────────────
    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeletingSession(sessionId);

        try {
            const response = await axios.delete<ApiResponse>(`/api/chat/delete?sessionId=${sessionId}`);
            if (response.data.success) {
                toast.success("Chat deleted.");
                if (sessionId === activeSessionId) {
                    setActiveSessionId(null);
                    setMessages([]);
                    setChatStatus("idle");
                }
                setSessionList(prev => prev.filter(s => s.sessionId !== sessionId));
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to delete chat.");
        } finally {
            setIsDeletingSession(null);
        }
    };

    // ─── SEND MESSAGE ─────────────────────────────────────
    const sendMessage = async () => {
        if (!input.trim() || !activeSessionId || isLoadingMessage) return;

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        const sentInput = input.trim();
        setInput("");
        setIsLoadingMessage(true);

        try {
            const response = await axios.post<ApiResponse & {
                reply: string;
                stage: string;
                status: string;
                sessionId: string;
                data: string;
            }>('/api/chat/message', {
                sessionId: activeSessionId,
                message: sentInput,
            });

            if (response.data.success) {
                const botMessage: Message = {
                    role: "assistant",
                    content: response.data.reply,
                    stage: response.data.stage,
                };
                setMessages(prev => [...prev, botMessage]);
                setChatStatus(response.data.status === "complete" ? "complete" : "questioning");
                if (response.data.sessionId) {
                    setActiveSessionId(response.data.sessionId);
                }
            } else {
                toast.error(response.data.message);
                // Remove optimistic user message on failure
                setMessages(prev => prev.slice(0, -1));
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to send message.");
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoadingMessage(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // ─── DOWNLOAD PDF REPORT ──────────────────────────────
    const handleDownloadReport = async () => {
        if (!activeSessionId) return;
        setIsDownloadingReport(true);

        try {
            const response = await axios.get(`/api/chat/report/pdf?sessionId=${activeSessionId}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `medassist_report_${activeSessionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Report downloaded.");
        } catch {
            toast.error("Failed to download report.");
        } finally {
            setIsDownloadingReport(false);
        }
    };

    // ─── LOADING STATE ────────────────────────────────────
    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <Loader2 className="animate-spin text-gray-400 h-8 w-8" />
            </div>
        );
    }

    if (!session) return null;

    const activeSession = sessionList.find(s => s.sessionId === activeSessionId);

    // ─── RENDER ───────────────────────────────────────────
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {/* ── LEFT PANEL — Session List ── */}
            <div className="w-64 bg-white border-r flex flex-col shrink-0">

                {/* Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-5 w-5 text-black" />
                        <h2 className="text-lg font-bold">MedAssist</h2>
                    </div>
                    <Button
                        onClick={handleNewChat}
                        disabled={isCreatingSession}
                        className="w-full bg-black text-white hover:bg-gray-800"
                    >
                        {isCreatingSession
                            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            : <PlusCircle className="h-4 w-4 mr-2" />
                        }
                        New Chat
                    </Button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingList ? (
                        <div className="flex justify-center mt-6">
                            <Loader2 className="animate-spin text-gray-400 h-5 w-5" />
                        </div>
                    ) : sessionList.length === 0 ? (
                        <div className="flex flex-col items-center mt-10 gap-2 text-gray-400">
                            <MessageSquare className="h-8 w-8" />
                            <p className="text-sm text-center">No chats yet.<br />Create one to get started.</p>
                        </div>
                    ) : (
                        sessionList.map((s) => (
                            <div
                                key={s.sessionId}
                                onClick={() => handleSessionClick(s.sessionId)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group transition-colors ${
                                    activeSessionId === s.sessionId
                                        ? "bg-gray-200 font-medium"
                                        : "hover:bg-gray-100"
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{s.title}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(s.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSession(s.sessionId, e)}
                                    disabled={isDeletingSession === s.sessionId}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all ml-1 shrink-0"
                                >
                                    {isDeletingSession === s.sessionId
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Trash2 className="h-4 w-4" />
                                    }
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL — Chat UI ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Chat Header */}
                <div className="bg-white border-b p-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-bold">
                            {activeSession?.title ?? "MedAssist Chatbot"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {!activeSessionId
                                ? "Select a chat or create a new one"
                                : chatStatus === "complete"
                                ? "✅ Diagnosis complete"
                                : chatStatus === "questioning"
                                ? "🩺 Analysing your symptoms..."
                                : "Start by describing your symptoms"
                            }
                        </p>
                    </div>

                    {/* Report download — only show when session is complete */}
                    {chatStatus === "complete" && activeSessionId && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/report?sessionId=${activeSessionId}`)}
                                className="flex items-center gap-1"
                            >
                                <FileText className="h-4 w-4" />
                                View Report
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadReport}
                                disabled={isDownloadingReport}
                                className="flex items-center gap-1"
                            >
                                {isDownloadingReport
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Download className="h-4 w-4" />
                                }
                                PDF
                            </Button>
                        </div>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* No session selected */}
                    {!activeSessionId ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3 text-gray-400">
                            <Bot className="h-12 w-12" />
                            <p className="text-center text-sm">
                                Select a chat from the left<br />or create a new one to begin
                            </p>
                        </div>

                    ) : isLoadingHistory ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-gray-400 h-6 w-6" />
                        </div>

                    ) : messages.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3 text-gray-400">
                            <MessageSquare className="h-10 w-10" />
                            <p className="text-sm text-center">
                                No messages yet.<br />Describe your symptoms to get started.
                            </p>
                        </div>

                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {/* Bot avatar */}
                                {msg.role === "assistant" && (
                                    <div className="flex items-end mr-2 shrink-0">
                                        <div className="h-7 w-7 rounded-full bg-black flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}

                                <div className={`max-w-[75%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                                    msg.role === "user"
                                        ? "bg-black text-white rounded-br-none"
                                        : "bg-white border text-gray-800 rounded-bl-none shadow-sm"
                                }`}>
                                    {msg.content}

                                    {/* Stage badge — subtle, only for assistant */}
                                    {msg.role === "assistant" && msg.stage && msg.stage !== "result" && (
                                        <span className="block mt-1 text-xs text-gray-400 uppercase tracking-wide">
                                            {msg.stage.replace("_", " ")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Bot typing indicator */}
                    {isLoadingMessage && (
                        <div className="flex justify-start items-end gap-2">
                            <div className="h-7 w-7 rounded-full bg-black flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-white border p-3 rounded-lg rounded-bl-none shadow-sm">
                                <div className="flex gap-1 items-center h-4">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Completion banner */}
                    {chatStatus === "complete" && !isLoadingMessage && (
                        <div className="flex justify-center">
                            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
                                ✅ Diagnosis complete — view your report above
                            </div>
                        </div>
                    )}

                    {/* Auto scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t p-4 shrink-0">
                    {chatStatus === "complete" ? (
                        <div className="flex justify-center">
                            <p className="text-sm text-gray-500">
                                This session is complete.{" "}
                                <button
                                    onClick={handleNewChat}
                                    disabled={isCreatingSession}
                                    className="text-black underline hover:no-underline font-medium"
                                >
                                    Start a new chat
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !isLoadingMessage) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder={
                                    !activeSessionId
                                        ? "Select or create a chat first..."
                                        : messages.length === 0
                                        ? "Describe your symptoms..."
                                        : "Type your reply..."
                                }
                                disabled={isLoadingMessage || !activeSessionId}
                                className="flex-1"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={isLoadingMessage || !input.trim() || !activeSessionId}
                                className="bg-black text-white hover:bg-gray-800 shrink-0"
                            >
                                {isLoadingMessage
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Send className="h-4 w-4" />
                                }
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatbotPage;