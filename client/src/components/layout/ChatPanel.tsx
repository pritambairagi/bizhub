import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { X, Send, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isMine: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'system',
      senderName: 'BizHub System',
      message: 'Welcome to BizHub Messenger! You can communicate with your team members here.',
      timestamp: new Date(),
      isMine: false,
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?._id || 'me',
      senderName: `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'You',
      message: newMessage.trim(),
      timestamp: new Date(),
      isMine: true,
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-screen w-full sm:w-96 bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Team Chat</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Online Members Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex -space-x-2">
          {['A', 'M', 'S'].map((initial, i) => (
            <div
              key={i}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-semibold text-primary"
            >
              {initial}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-1">3 members online</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex flex-col max-w-[85%]', msg.isMine ? 'ml-auto items-end' : 'items-start')}
          >
            {!msg.isMine && (
              <span className="text-[10px] font-medium text-muted-foreground mb-1 px-1">
                {msg.senderName}
              </span>
            )}
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.isMine
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              )}
            >
              {msg.message}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
