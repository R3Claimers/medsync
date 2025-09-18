import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Bot, User, Sparkles, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { request } from '@/lib/api';

interface Message {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    isFallback?: boolean;
  };
}

interface ChatSession {
  sessionId: string;
  messages: Message[];
  isActive: boolean;
  lastActivity: Date;
}

const AIHealthAssistant = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample questions based on user role
  const getSampleQuestions = () => {
    if (!user) return [];
    
    if (user.role === 'patient') {
      return [
        "What are the symptoms of common cold?",
        "When should I see a doctor for fever?",
        "How to manage stress and anxiety?",
        "What foods are good for heart health?",
        "How to prepare for a doctor's appointment?"
      ];
    } else if (user.role === 'doctor') {
      return [
        "Latest treatment guidelines for hypertension",
        "How to explain complex conditions to patients?",
        "Best practices for patient communication",
        "Managing patient appointment schedules",
        "Staying updated with medical research"
      ];
    } else {
      return [
        "How can I help patients navigate the hospital?",
        "What information should I collect during registration?",
        "How to handle emergency situations?",
        "Best practices for patient care",
        "Understanding hospital procedures"
      ];
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    if (user) {
      initializeChat();
      loadHealthSuggestions();
    }
  }, [user]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const response = await request('/ai-chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ sessionType: 'general' })
      });
      
      const session = response.session;
      setCurrentSession(session);
      setMessages(session.messages || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to initialize chat:', err);
      setError('Failed to start chat session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthSuggestions = async () => {
    try {
      const response = await request('/ai-chat/suggestions');
      setSuggestions(response.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSuggestions(getSampleQuestions());
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading) return;

    const userMessage: Message = {
      messageId: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await request(`/ai-chat/sessions/${currentSession.sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: inputMessage.trim() })
      });

      const { assistantMessage } = response;
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to get response. Please try again.');
      
      // Add fallback message
      const fallbackMessage: Message = {
        messageId: `fallback-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or contact your healthcare provider if this is urgent.",
        timestamp: new Date(),
        metadata: { isFallback: true }
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to use the AI Health Assistant.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-primary font-medium mb-4">
            <Sparkles className="h-5 w-5" />
            <span>AI-Powered Healthcare</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            MedSync AI Health Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get instant answers to your health questions with our intelligent AI assistant powered by Google Gemini. 
            Available 24/7 to provide personalized health guidance and support.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-6 w-6" />
                  <span>AI Health Assistant</span>
                  <span className="text-sm bg-white/20 px-2 py-1 rounded">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-sm">Online</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : message.metadata?.isFallback
                          ? 'bg-red-50 text-red-900 border border-red-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <Bot className={`h-4 w-4 mt-1 ${message.metadata?.isFallback ? 'text-red-500' : 'text-primary'}`} />
                        )}
                        {message.role === 'user' && (
                          <User className="h-4 w-4 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sample Questions */}
              {suggestions.length > 0 && (
                <div className="border-t border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-3">Try asking:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestions.slice(0, 4).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSampleQuestion(question)}
                        className="text-xs hover:bg-primary hover:text-white transition-colors"
                        disabled={isLoading}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask me anything about health..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                    disabled={isLoading || !currentSession}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="medical-gradient text-white hover:opacity-90"
                    disabled={!inputMessage.trim() || isLoading || !currentSession}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * This AI assistant provides general health information only and should not replace professional medical advice.
                  Powered by Google Gemini AI.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIHealthAssistant;
