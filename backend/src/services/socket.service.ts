import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { db } from "../lib/db.js";
import { user } from "../models/auth-schema.js";
import { conversations, messages } from "../models/chat-schema.js";
import { eq, and, or } from "drizzle-orm";

let io: Server | null = null;

// Map to track user connections: userId -> Set of socket IDs
const userSockets = new Map<string, Set<string>>();

// Map to track which conversation each socket is viewing
const socketConversations = new Map<string, number>();

export const initializeSocketIO = (httpServer: HTTPServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:3000",
                "http://localhost:5173",
                "https://pulchowk-x.vercel.app",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
        path: "/socket.io/",
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Authenticate user
        socket.on("authenticate", async (userId: string) => {
            try {
                // Verify user exists in database
                const dbUser = await db.query.user.findFirst({
                    where: eq(user.id, userId),
                });

                if (!dbUser) {
                    socket.emit("error", { message: "Invalid user ID" });
                    return;
                }

                // Store user's socket connection
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId)!.add(socket.id);

                // Store userId in socket data for later use
                socket.data.userId = userId;

                // Join user's personal room for direct messages
                socket.join(`user:${userId}`);

                socket.emit("authenticated", { success: true });
                console.log(`User ${userId} authenticated with socket ${socket.id}`);
            } catch (error) {
                console.error("Authentication error:", error);
                socket.emit("error", { message: "Authentication failed" });
            }
        });

        // Join a conversation room
        socket.on("joinConversation", async (conversationId: number) => {
            const userId = socket.data.userId;
            if (!userId) {
                socket.emit("error", { message: "Not authenticated" });
                return;
            }

            try {
                // Verify user is part of this conversation
                const conversation = await db.query.conversations.findFirst({
                    where: and(
                        eq(conversations.id, conversationId),
                        or(
                            eq(conversations.buyerId, userId),
                            eq(conversations.sellerId, userId)
                        )
                    ),
                });

                if (!conversation) {
                    socket.emit("error", { message: "Conversation not found or access denied" });
                    return;
                }

                // Leave previous conversation if any
                const previousConversation = socketConversations.get(socket.id);
                if (previousConversation) {
                    socket.leave(`conversation:${previousConversation}`);
                }

                // Join new conversation room
                socket.join(`conversation:${conversationId}`);
                socketConversations.set(socket.id, conversationId);

                socket.emit("joinedConversation", { conversationId });
                console.log(`User ${userId} joined conversation ${conversationId}`);
            } catch (error) {
                console.error("Join conversation error:", error);
                socket.emit("error", { message: "Failed to join conversation" });
            }
        });

        // Leave a conversation room
        socket.on("leaveConversation", (conversationId: number) => {
            socket.leave(`conversation:${conversationId}`);
            socketConversations.delete(socket.id);
            console.log(`Socket ${socket.id} left conversation ${conversationId}`);
        });

        // Handle typing indicator
        socket.on("typing", async (conversationId: number) => {
            const userId = socket.data.userId;
            if (!userId) return;

            // Broadcast to other users in the conversation
            socket.to(`conversation:${conversationId}`).emit("userTyping", {
                conversationId,
                userId,
            });
        });

        // Handle stop typing
        socket.on("stopTyping", async (conversationId: number) => {
            const userId = socket.data.userId;
            if (!userId) return;

            socket.to(`conversation:${conversationId}`).emit("userStoppedTyping", {
                conversationId,
                userId,
            });
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            const userId = socket.data.userId;
            if (userId) {
                const sockets = userSockets.get(userId);
                if (sockets) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                    }
                }
            }
            socketConversations.delete(socket.id);
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    console.log("Socket.IO initialized");
    return io;
};

export const getIO = (): Server | null => io;

// Send a new message to all users in a conversation
export const emitNewMessage = (conversationId: number, message: any) => {
    if (io) {
        io.to(`conversation:${conversationId}`).emit("newMessage", {
            conversationId,
            message,
        });
    }
};

// Send notification to a specific user (for when they're not viewing the conversation)
export const emitMessageNotification = (userId: string, notification: any) => {
    if (io) {
        io.to(`user:${userId}`).emit("messageNotification", notification);
    }
};

// Check if a user is currently viewing a specific conversation
export const isUserViewingConversation = (userId: string, conversationId: number): boolean => {
    const sockets = userSockets.get(userId);
    if (!sockets) return false;

    for (const socketId of sockets) {
        if (socketConversations.get(socketId) === conversationId) {
            return true;
        }
    }
    return false;
};

// Check if a user is online (has at least one active socket connection)
export const isUserOnline = (userId: string): boolean => {
    const sockets = userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
};
