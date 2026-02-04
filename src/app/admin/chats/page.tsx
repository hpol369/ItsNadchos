"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, User, Clock } from "lucide-react";
import styles from "../admin.module.css";
import chatStyles from "./chats.module.css";

interface UserWithMessage {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  total_messages: number;
  is_blocked: boolean;
  created_at: string;
  last_active_at: string | null;
  last_message: string | null;
  last_message_role: string | null;
  last_message_at: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface UserInfo {
  display_name: string | null;
  username: string | null;
  telegram_id: number;
  total_messages: number;
  created_at: string;
}

export default function ChatsPage() {
  const [users, setUsers] = useState<UserWithMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Fetch messages when user selected
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setUserInfo(null);
      return;
    }

    async function fetchMessages() {
      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/admin/messages?userId=${selectedUserId}`);
        const data = await response.json();
        setMessages(data.messages || []);
        setUserInfo(data.user || null);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [selectedUserId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Gisteren";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("nl-NL", { weekday: "short" });
    } else {
      return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    }
  }

  function formatMessageTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMessageDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  // Group messages by date
  function groupMessagesByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    for (const message of messages) {
      const messageDate = new Date(message.created_at).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.created_at, messages: [] });
      }
      groups[groups.length - 1].messages.push(message);
    }

    return groups;
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={chatStyles.chatsLayout}>
      {/* Users List */}
      <div className={chatStyles.usersList}>
        <div className={chatStyles.usersHeader}>
          <h3>Chats</h3>
          <span>{users.length} users</span>
        </div>

        {loadingUsers ? (
          <div className={styles.emptyState}>
            <p>Loading...</p>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No users yet</p>
          </div>
        ) : (
          <div className={chatStyles.usersScroll}>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`${chatStyles.userItem} ${
                  selectedUserId === user.id ? chatStyles.active : ""
                }`}
              >
                <div className={chatStyles.userAvatar}>
                  <User size={20} />
                </div>
                <div className={chatStyles.userInfo}>
                  <div className={chatStyles.userName}>
                    {user.display_name || user.first_name || user.username || "Unknown"}
                    {user.is_blocked && <span className={chatStyles.blockedBadge}>Blocked</span>}
                  </div>
                  <div className={chatStyles.userLastMessage}>
                    {user.last_message_role === "assistant" && <span>Nadchos: </span>}
                    {user.last_message || "No messages"}
                  </div>
                </div>
                <div className={chatStyles.userMeta}>
                  {user.last_message_at && (
                    <span className={chatStyles.userTime}>
                      {formatTime(user.last_message_at)}
                    </span>
                  )}
                  <span className={chatStyles.messageCount}>{user.total_messages}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat View */}
      <div className={chatStyles.chatView}>
        {!selectedUserId ? (
          <div className={chatStyles.noChat}>
            <MessageCircle size={48} />
            <p>Selecteer een user om de chat te bekijken</p>
          </div>
        ) : loadingMessages ? (
          <div className={chatStyles.noChat}>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={chatStyles.chatHeader}>
              <div className={chatStyles.chatHeaderInfo}>
                <div className={chatStyles.chatHeaderAvatar}>
                  <User size={24} />
                </div>
                <div>
                  <div className={chatStyles.chatHeaderName}>
                    {userInfo?.display_name || userInfo?.username || "Unknown"}
                  </div>
                  <div className={chatStyles.chatHeaderMeta}>
                    {userInfo?.username && `@${userInfo.username} · `}
                    {userInfo?.total_messages} berichten
                  </div>
                </div>
              </div>
              <div className={chatStyles.chatHeaderActions}>
                <span className={chatStyles.telegramId}>
                  ID: {userInfo?.telegram_id}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className={chatStyles.messagesContainer}>
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className={chatStyles.dateHeader}>
                    <span>{formatMessageDate(group.date)}</span>
                  </div>
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${chatStyles.message} ${
                        message.role === "user" ? chatStyles.userMessage : chatStyles.botMessage
                      }`}
                    >
                      <div className={chatStyles.messageBubble}>
                        <div className={chatStyles.messageContent}>{message.content}</div>
                        <div className={chatStyles.messageTime}>
                          <Clock size={12} />
                          {formatMessageTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
