import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare } from 'lucide-react';
import AIHealthAssistant from './AIHealthAssistant';

interface AIChatModalProps {
  children: React.ReactNode;
  title?: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ 
  children,
  title = "AI Health Assistant"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[80vh] p-0 mx-4">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <AIHealthAssistant />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIChatModal;
