import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const Chat = () => {
  const [round, setRound] = useState(1);
  const [isProTurn, setIsProTurn] = useState(true);
  const [topic, setTopic] = useState("");
  const [isDebateStarted, setIsDebateStarted] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  
  const { messages, setMessages, append } = useChat({
    api: "/api/openai",
    body: {
      topic,
      round,
      isProTurn,
    },
    onResponse: () => {
      setIsWaitingForResponse(false);
    },
    onFinish: () => {
      // Only increment API call count when a response is fully generated
      setTimeout(() => {
        setApiCallCount(prev => prev + 1);
      }, 500); // Add a 500ms delay before updating the turn label
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setIsWaitingForResponse(false);
    }
  });

  const chatContainer = useRef<HTMLDivElement>(null);
  const responseContainer = useRef<HTMLDivElement>(null);

  // Function to trigger the next debate turn
  const triggerNextTurn = async () => {
    if (turnCount < 4) { // Limit to exactly 4 turns
      setIsWaitingForResponse(true);
      try {
        // Only append system message for AI turns, not for user message duplications
        await append({
          role: 'system',
          content: topic,
        });
        
        // Update turn count
        const nextTurnCount = turnCount + 1;
        setTurnCount(nextTurnCount);
        
        // Hard-coded order of speakers: Pro, Con, Con, Pro, Pro, Con, Con, Pro
        const speakerOrder = [
          'pro', 'con', 'con', 'pro', 'pro', 'con', 'con', 'pro'
        ];
        
        // Set isProTurn based on the next turn in the sequence
        if (nextTurnCount < speakerOrder.length) {
          setIsProTurn(speakerOrder[nextTurnCount] === 'pro');
        }
      } catch (error) {
        console.error('Error in debate turn:', error);
        setIsWaitingForResponse(false);
      }
    }
  };

  // Start the debate when topic is submitted
  const handleTopicSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (topic.trim()) {
      setIsDebateStarted(true);
      await triggerNextTurn();
    }
  };

  // Watch for message changes to trigger next turn
  useEffect(() => {
    if (isDebateStarted && !isWaitingForResponse && turnCount < 4 && messages.length > 0) {
      const timer = setTimeout(() => {
        triggerNextTurn();
      }, 2000); // Wait 2 seconds before next turn
      return () => clearTimeout(timer);
    }
  }, [messages, isDebateStarted, isWaitingForResponse]);

  // Improved autoscroll function
  const scrollToBottom = () => {
    if (responseContainer.current) {
      responseContainer.current.scrollTop = responseContainer.current.scrollHeight;
    }
  };

  // Scroll to bottom whenever messages change or a new message is added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get the current turn label based on API call count
  const getTurnLabel = () => {
    const turnLabels = [
      "Pro Opening Argument",
      "Con Opening Argument",
      "Con Rebuttal",
      "Pro Rebuttal",
      "Pro Reinforcement",
      "Con Reinforcement",
      "Con Closing Argument",
      "Pro Closing Argument"
    ];
    
    return apiCallCount < turnLabels.length ? turnLabels[apiCallCount] : "Debate Finished!";
  };

  const renderResponse = () => {
    // Filter out system messages to avoid duplication
    const visibleMessages = messages.filter(m => m.role !== 'system');
    
    // Hard-coded order of speakers: Pro, Con, Con, Pro, Pro, Con, Con, Pro
    const speakerOrder = [
      'pro', 'con', 'con', 'pro', 'pro', 'con', 'con', 'pro'
    ];
    
    return (
      <div className="response" ref={responseContainer}>
        {visibleMessages.map((m, index) => {
          // Determine if this is a Pro or Con message based on the hard-coded order
          const isProMessage = index < speakerOrder.length ? speakerOrder[index] === 'pro' : index % 2 === 0;
          
          return (
            <div
              key={m.id}
              className={`chat-line ${
                m.role === "user" ? "user-chat" : "ai-chat"
              } ${!isProMessage ? "opposite-side" : ""}`}
            >
              <Image
                className="avatar"
                alt="avatar"
                width={40}
                height={40}
                src={isProMessage ? "/pro-avatar.png" : "/con-avatar.png"}
              />
              <div className={`message-container ${!isProMessage ? "message-container-opposite" : ""}`}>
                <p className={`message ${!isProMessage ? "opposite-message" : ""}`}>
                  {m.content}
                </p>
                {index < visibleMessages.length - 1 && (
                  <div className="horizontal-line" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={chatContainer} className="chat-container">
      {!isDebateStarted ? (
        <form onSubmit={handleTopicSubmit} className="topic-form">
          <input
            type="text"
            placeholder="Enter debate topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="topic-input"
          />
          <button type="submit" className="start-button">Start Debate</button>
        </form>
      ) : (
        <>
          <div className="round-indicator">
            {getTurnLabel()}
          </div>
          {renderResponse()}
        </>
      )}
    </div>
  );
};

export default Chat;
