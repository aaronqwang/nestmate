'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Match {
  id: string;
  user_id: string;
  full_name: string;
  profile_photo: string;
  major: string;
  term: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('user');
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch matches
  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      try {
        const { data: matchesData, error } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_active', true);

        if (error) throw error;

        const matchesList: Match[] = [];

        for (const match of matchesData || []) {
          const matchedUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, profile_photo, major, term')
            .eq('id', matchedUserId)
            .single();

          if (userData) {
            matchesList.push({
              id: match.id,
              user_id: userData.id,
              full_name: userData.full_name,
              profile_photo: userData.profile_photo,
              major: userData.major,
              term: userData.term,
            });
          }
        }

        setMatches(matchesList);

        // Auto-select match if user param is provided
        if (selectedUserId) {
          const match = matchesList.find(m => m.user_id === selectedUserId);
          if (match) setSelectedMatch(match);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user, supabase, selectedUserId]);

  // Fetch messages for selected match
  useEffect(() => {
    if (!selectedMatch) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', selectedMatch.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${selectedMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${selectedMatch.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if not already in messages (prevent duplicate from optimistic update)
          setMessages((current) => {
            const exists = current.some(msg => msg.id === newMsg.id);
            return exists ? current : [...current, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch, supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedMatch || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setUploading(true);

    try {
      let attachmentUrl = '';
      let attachmentName = '';

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `message-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // If storage bucket doesn't exist, store as base64
          const reader = new FileReader();
          await new Promise((resolve) => {
            reader.onloadend = () => {
              attachmentUrl = reader.result as string;
              attachmentName = selectedFile.name;
              resolve(null);
            };
            reader.readAsDataURL(selectedFile);
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);
          attachmentUrl = urlData.publicUrl;
          attachmentName = selectedFile.name;
        }
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      const { data, error } = await supabase.from('messages').insert({
        match_id: selectedMatch.id,
        sender_id: user.id,
        content: messageContent || (attachmentName ? `Sent ${attachmentName}` : ''),
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
      }).select().single();

      if (error) throw error;

      // Optimistically add message to UI immediately
      if (data) {
        setMessages((current) => [...current, data as Message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Matches Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>
        
        {matches.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No matches yet
          </div>
        ) : (
          <div>
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 border-b border-gray-100 ${
                  selectedMatch?.id === match.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {match.profile_photo ? (
                    <Image
                      src={match.profile_photo}
                      alt={match.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-2xl">👤</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">
                    {match.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {match.major} • {match.term}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                {selectedMatch.profile_photo ? (
                  <Image
                    src={selectedMatch.profile_photo}
                    alt={selectedMatch.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xl">👤</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedMatch.full_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedMatch.major} • {selectedMatch.term}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    {message.attachment_url && (
                      <div className="mb-2">
                        {message.attachment_url.startsWith('data:image') || message.attachment_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={message.attachment_url} 
                            alt={message.attachment_name || 'Attachment'}
                            className="max-w-full rounded-lg mb-1"
                          />
                        ) : (
                          <a 
                            href={message.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded ${
                              message.sender_id === user?.id
                                ? 'bg-indigo-700 hover:bg-indigo-800'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-sm">{message.attachment_name}</span>
                          </a>
                        )}
                      </div>
                    )}
                    {message.content && <p>{message.content}</p>}
                    <p
                      className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? 'text-indigo-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="flex-1">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                title="Attach file"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedFile) || uploading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">Select a match to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
