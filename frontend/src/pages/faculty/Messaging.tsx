import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getConversation, sendMessage, getContacts } from '../../api';
import type { ChatMessage, User } from '../../api';

export default function Messaging() {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?.userId) {
      setLoadingContacts(false);
      return;
    }
    getContacts(currentUser.userId)
      .then(users => setContacts(users.filter(u => u.id !== currentUser.userId && u.role === 'STUDENT')))
      .catch(() => {}).finally(() => setLoadingContacts(false));
  }, [currentUser]);

  useEffect(() => {
    if (!selected || !currentUser) return;
    const load = () => getConversation(currentUser.userId, selected.id).then(setMessages).catch(() => {});
    load();
    const iv = setInterval(load, 4000);
    return () => clearInterval(iv);
  }, [selected, currentUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selected || !currentUser || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(currentUser.userId, selected.id, newMsg.trim());
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch { } finally { setSending(false); }
  };

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-brand-navy">Student Messaging</h1>
        <p className="text-sm text-slate-500 mt-1">Communicate directly with your students</p></div>
      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <span className="text-sm font-bold text-brand-navy">Students</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loadingContacts ? <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-brand-indigo" size={20} /></div> :
             contacts.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No student accounts found</p> :
             contacts.map(c => {
              const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selected?.id === c.id ? 'bg-brand-indigo/5 border-r-2 border-brand-indigo' : 'hover:bg-slate-50'}`}>
                  <div className="w-9 h-9 rounded-full bg-brand-emerald flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-navy truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">Student</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-3 text-slate-300" />
              <p className="font-semibold">Select a student to start messaging</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-emerald flex items-center justify-center text-white text-xs font-bold">
                  {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-brand-navy text-sm">{selected.name}</p>
                  <p className="text-xs text-brand-indigo font-medium">Student</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser?.userId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-indigo text-white rounded-br-sm' : 'bg-slate-100 text-brand-navy rounded-bl-sm'}`}>
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo" />
                  <button onClick={handleSend} disabled={!newMsg.trim() || sending}
                    className="bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
