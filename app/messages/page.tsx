'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

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
  const [loading, setLoading] = useState(true);
  const [videoCallUrl, setVideoCallUrl] = useState('');
  const [videoCallActive, setVideoCallActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

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
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch, supabase]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: selectedMatch.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startVideoCall = () => {
    setVideoCallActive(true);
    
    // Wait for next tick to ensure container is rendered
    setTimeout(() => {
      if (jitsiContainerRef.current && selectedMatch) {
        const roomName = `nestmate-${selectedMatch.id}-${Date.now()}`;
        
        // Load Jitsi Meet API
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          // @ts-ignore
          const JitsiMeetExternalAPI = window.JitsiMeetExternalAPI;
          
          jitsiApiRef.current = new JitsiMeetExternalAPI('meet.jit.si', {
            roomName: roomName,
            parentNode: jitsiContainerRef.current,
            configOverwrite: {
              prejoinPageEnabled: false,
              startWithVideoMuted: false,
              startWithAudioMuted: false,
              disableDeepLinking: true,
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              BRAND_WATERMARK_LINK: '',
              JITSI_WATERMARK_LINK: '',
              SHOW_POWERED_BY: false,
              DISPLAY_WELCOME_PAGE_CONTENT: false,
              DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
              APP_NAME: 'NestMate',
              NATIVE_APP_NAME: 'NestMate',
              PROVIDER_NAME: 'NestMate',
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
              ],
            },
          });
        };
        document.head.appendChild(script);
      }
    }, 100);
  };

  const endVideoCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setVideoCallActive(false);
    setVideoCallUrl('');
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
            
            {/* Video Call Button */}
            <button
              onClick={startVideoCall}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Video Call</span>
            </button>
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
                    <p>{message.content}</p>
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
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

      {/* Video Call Modal */}
      {videoCallActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white rounded-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold">Video Call with {selectedMatch?.full_name}</span>
              </div>
              <button
                onClick={endVideoCall}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="End call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Jitsi container */}
            <div ref={jitsiContainerRef} className="flex-1 w-full bg-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
