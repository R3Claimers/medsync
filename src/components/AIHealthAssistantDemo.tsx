import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Bot, User, Sparkles, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIHealthAssistantDemo = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm MedSync AI, your healthcare assistant. I can help answer general health questions, provide medical information, and guide you on when to seek professional care. Try asking me something!",
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const sampleQuestions = [
    "What are the symptoms of common cold?",
    "When should I see a doctor for fever?",
    "How to manage stress and anxiety?",
    "What foods are good for heart health?",
    "How to prepare for a doctor's appointment?"
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Skip scroll on initial mount, only scroll when new messages are added
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  // Demo responses for different types of questions
  const getDemoResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('cold') || lowerQ.includes('cough') || lowerQ.includes('flu')) {
      return "Common cold symptoms include runny nose, sneezing, cough, mild fever, and fatigue. Rest, stay hydrated, and consider over-the-counter medications for symptom relief. If symptoms worsen or persist beyond 10 days, consult a healthcare provider.";
    }
    
    if (lowerQ.includes('fever') || lowerQ.includes('temperature')) {
      return "You should see a doctor for fever if: temperature is over 103°F (39.4°C), fever lasts more than 3 days, you have severe symptoms like difficulty breathing, chest pain, or persistent vomiting. For children under 3 months, any fever warrants immediate medical attention.";
    }
    
    if (lowerQ.includes('stress') || lowerQ.includes('anxiety')) {
      return "To manage stress and anxiety: practice deep breathing exercises, maintain regular sleep schedule, engage in physical activity, try meditation or mindfulness, limit caffeine and alcohol, talk to friends/family, and consider professional counseling if symptoms persist.";
    }
    
    if (lowerQ.includes('heart') || lowerQ.includes('cardiac')) {
      return "Heart-healthy foods include: fatty fish (salmon, mackerel), leafy greens, berries, whole grains, nuts, avocados, olive oil, and lean proteins. Limit processed foods, excess sodium, and saturated fats. A Mediterranean-style diet is excellent for heart health.";
    }
    
    if (lowerQ.includes('appointment') || lowerQ.includes('doctor visit')) {
      return "To prepare for a doctor's appointment: list your symptoms and when they started, bring current medications, prepare questions you want to ask, bring insurance cards and ID, arrive early, and consider bringing a family member for support if needed.";
    }
    
    if (lowerQ.includes('headache') || lowerQ.includes('migraine')) {
      return "For headaches: stay hydrated, rest in a quiet dark room, apply cold/warm compress, consider over-the-counter pain relievers, manage stress, and maintain regular sleep. Seek medical care for sudden severe headaches, recurring headaches, or those with vision changes.";
    }
    
    if (lowerQ.includes('sleep') || lowerQ.includes('insomnia')) {
      return "For better sleep: maintain consistent sleep schedule, create relaxing bedtime routine, avoid screens before bed, keep bedroom cool and dark, limit caffeine after 2 PM, exercise regularly but not close to bedtime, and avoid large meals before sleep.";
    }
    
    // Default responses for other questions
    const defaultResponses = [
      "That's a great health question! While I can provide general information, it's important to consult with a healthcare professional for personalized medical advice. Based on general medical knowledge, here are some helpful points to consider...",
      "Thank you for your health question. For the most accurate and personalized guidance, I recommend discussing this with your healthcare provider. However, here's some general information that might be helpful...",
      "I understand your concern about this health topic. While I can share general medical information, please remember that this doesn't replace professional medical consultation. Here's what you should know...",
      "That's an important health question. For specific medical advice tailored to your situation, please consult with a qualified healthcare provider. In general terms, here's some helpful information..."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: DemoMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: DemoMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: getDemoResponse(inputMessage),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // 1.5-2.5 seconds
  };

  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <section className="py-20 bg-gray-50" data-ai-demo>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-primary font-medium mb-4">
            <Sparkles className="h-5 w-5" />
            <span>AI-Powered Healthcare</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Try Our AI Health Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our intelligent AI assistant powered by Google Gemini. Get instant answers to your health questions, 
            available 24/7 to provide general health guidance and support.
          </p>
          
          {/* Demo Notice */}
          <div className="mt-6 inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <Info className="h-4 w-4" />
            <span>Demo Mode - Sign up for full AI features</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-6 w-6" />
                  <span>MedSync AI Health Assistant</span>
                  <span className="text-sm bg-white/20 px-2 py-1 rounded">
                    Demo
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-sm">Online</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-4 w-4 mt-1 text-primary" />
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
                
                {isTyping && (
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
              <div className="border-t border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSampleQuestion(question)}
                      className="text-xs hover:bg-primary hover:text-white transition-colors"
                      disabled={isTyping}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask me anything about health..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="medical-gradient text-white hover:opacity-90"
                    disabled={!inputMessage.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * This AI assistant provides general health information only and should not replace professional medical advice.
                  Powered by Google Gemini AI.
                </p>
              </div>

              {/* Call to Action */}
              <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 p-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Want Full AI Health Features?
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Sign up to access personalized health recommendations, appointment booking, 
                    prescription management, and advanced AI diagnostics.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      onClick={() => navigate('/register')}
                      className="medical-gradient text-white hover:opacity-90"
                    >
                      Sign Up Free
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/login')}
                    >
                      Login
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIHealthAssistantDemo;
