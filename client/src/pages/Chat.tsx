import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Send, Search, MessageSquare, Users, Megaphone, Circle,
  ChevronRight, X, Bell, User
} from 'lucide-react';
import { io as socketIO, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  senderId: { _id: string; email: string; profile?: { firstName?: string; lastName?: string }; role?: string };
  receiverId?: string;
  message: string;
  isGlobal: boolean;
  type: string;
  readBy: string[];
  createdAt: string;
}

interface ChatUser {
  _id: string;
  email: string;
  profile?: { firstName?: string; lastName?: string };
  role: string;
  status: string;
}

export default function Chat() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dm' | 'notice'>('dm');
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [noticeMessages, setNoticeMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketPath = import.meta.env.VITE_SOCKET_PATH || '/socket.io';
    const s = socketIO(socketUrl, { path: socketPath, transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      if (user?.businessId) s.emit('join-business', user.businessId);
    });

    s.on('chat:message', (msg: Message) => {
      if (msg.isGlobal) {
        setNoticeMessages(prev => [...prev, msg]);
      } else {
        const myId = user?._id;
        const isMine = msg.senderId?._id === myId;
        const isForMe = msg.receiverId === myId;
        if (isMine || isForMe) {
          setMessages(prev => [...prev, msg]);
        }
      }
    });

    s.on('chat:typing', (data: { senderId: string; isTyping: boolean }) => {
      setIsTyping(data.isTyping ? data.senderId : null);
      clearTimeout(typingTimer.current);
      if (data.isTyping) {
        typingTimer.current = setTimeout(() => setIsTyping(null), 3000);
      }
    });

    return () => { s.disconnect(); };
  }, [user]);

  // ── Load team users ───────────────────────────────────────────────────────
  const { data: usersData } = useQuery({
    queryKey: ['chat-users'],
    queryFn: () => api.get('/chat/users').then(r => r.data.data),
  });
  const chatUsers: ChatUser[] = usersData || [];
  const filteredUsers = chatUsers.filter(u =>
    `${u.profile?.firstName} ${u.profile?.lastName} ${u.email}`.toLowerCase().includes(searchUsers.toLowerCase())
  );

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (peerId?: string) => {
    try {
      const params: any = peerId ? { peerId } : {};
      const res = await api.get('/chat/messages', { params });
      if (peerId) setMessages(res.data.data);
      else setNoticeMessages(res.data.data);
    } catch { }
  }, []);

  useEffect(() => {
    if (selectedUser) loadMessages(selectedUser._id);
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    if (activeTab === 'notice') loadMessages();
  }, [activeTab, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, noticeMessages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const isGlobal = activeTab === 'notice';

    if (socket?.connected && user?.businessId) {
      socket.emit('chat:send', {
        businessId: user.businessId,
        senderId: user._id,
        receiverId: selectedUser?._id,
        message: messageInput.trim(),
        isGlobal,
      });
    } else {
      // REST fallback
      api.post('/chat/messages', {
        receiverId: selectedUser?._id,
        message: messageInput.trim(),
        isGlobal,
      }).then(res => {
        if (isGlobal) setNoticeMessages(prev => [...prev, res.data.data]);
        else setMessages(prev => [...prev, res.data.data]);
      }).catch(() => toast.error('Failed to send'));
    }
    setMessageInput('');
  };

  const handleTyping = () => {
    if (socket && selectedUser && user?.businessId) {
      socket.emit('chat:typing', {
        businessId: user.businessId,
        senderId: user._id,
        receiverId: selectedUser._id,
        isTyping: true,
      });
    }
  };

  const getName = (u: any) => {
    if (!u) return 'Unknown';
    if (u.profile?.firstName) return `${u.profile.firstName} ${u.profile.lastName || ''}`.trim();
    return u.email;
  };

  const getInitial = (u: any) => getName(u).charAt(0).toUpperCase();

  const displayMessages = activeTab === 'notice' ? noticeMessages : messages;
  const myId = user?._id;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r border-slate-100 bg-slate-50">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Team Chat
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{chatUsers.length} members</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button onClick={() => { setActiveTab('dm'); setSelectedUser(null); }}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors",
              activeTab === 'dm' ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600")}>
            <Users className="h-3.5 w-3.5" /> Messages
          </button>
          <button onClick={() => setActiveTab('notice')}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors",
              activeTab === 'notice' ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600")}>
            <Megaphone className="h-3.5 w-3.5" /> Notice Board
          </button>
        </div>

        {/* Search */}
        {activeTab === 'dm' && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input className="pl-9 h-8 text-xs bg-white border-slate-200" placeholder="Search team..."
                value={searchUsers} onChange={e => setSearchUsers(e.target.value)} />
            </div>
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dm' ? (
            filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No team members found</div>
            ) : (
              filteredUsers.map(u => (
                <button key={u._id} onClick={() => setSelectedUser(u)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-white transition-all border-b border-slate-100/50 text-left",
                    selectedUser?._id === u._id ? "bg-white border-l-2 border-l-primary shadow-sm" : "")}>
                  <div className="relative flex-shrink-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {getInitial(u)}
                    </div>
                    <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                      u.status === 'active' ? "bg-emerald-400" : "bg-slate-300")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{getName(u)}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                </button>
              ))
            )
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                <Bell className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Notice Board — Visible to all team members</p>
              </div>
              {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'super_admin') && (
                <p className="text-[10px] text-slate-400 text-center">You can post announcements here</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          {activeTab === 'dm' && selectedUser ? (
            <>
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                  {getInitial(selectedUser)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{getName(selectedUser)}</p>
                <p className="text-xs text-slate-400 capitalize">{selectedUser.role}</p>
              </div>
              {isTyping === selectedUser._id && (
                <span className="ml-auto text-xs text-slate-400 italic animate-pulse">typing...</span>
              )}
            </>
          ) : activeTab === 'notice' ? (
            <>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Notice Board</p>
                <p className="text-xs text-slate-400">Broadcast to all team members</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-slate-400">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm">Select a team member to start chatting</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(activeTab === 'dm' && !selectedUser) ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <MessageSquare className="h-16 w-16 mb-4" />
              <p className="font-bold text-slate-400 text-lg">No conversation selected</p>
              <p className="text-sm text-slate-300 mt-1">Pick a team member from the sidebar</p>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <Send className="h-12 w-12 mb-4" />
              <p className="text-slate-400 font-semibold">No messages yet</p>
              <p className="text-sm mt-1">Send the first message!</p>
            </div>
          ) : (
            displayMessages.map(msg => {
              const isMine = (msg.senderId?._id || msg.senderId as any) === myId;
              return (
                <div key={msg._id} className={cn("flex gap-3", isMine ? "flex-row-reverse" : "flex-row")}>
                  {!isMine && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {getInitial(msg.senderId)}
                    </div>
                  )}
                  <div className={cn("max-w-[65%] space-y-1", isMine ? "items-end" : "items-start")}>
                    {!isMine && (
                      <p className="text-[10px] font-bold text-slate-400 px-1">{getName(msg.senderId)}</p>
                    )}
                    <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMine
                        ? "bg-primary text-white rounded-tr-sm"
                        : msg.type === 'notice'
                          ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm"
                          : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    )}>
                      {msg.message}
                    </div>
                    <p className={cn("text-[10px] text-slate-400 px-1", isMine ? "text-right" : "text-left")}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(activeTab === 'notice' || selectedUser) && (
          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                {activeTab === 'notice' && (
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    <Megaphone className="h-3 w-3" /> Broadcasting to all team members
                  </div>
                )}
                <Input
                  className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                  placeholder={activeTab === 'notice' ? "Post an announcement..." : `Message ${selectedUser ? getName(selectedUser) : ''}...`}
                  value={messageInput}
                  onChange={e => { setMessageInput(e.target.value); handleTyping(); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
              </div>
              <Button onClick={sendMessage} disabled={!messageInput.trim()}
                className="bg-primary hover:bg-primary/90 text-white h-10 w-10 p-0 rounded-xl flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
