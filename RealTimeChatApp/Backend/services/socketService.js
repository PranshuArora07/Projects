const {Server} = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');

//map to store the online users -> (userId, socketId)
const onlineUsers = new Map();

//map to track typing status
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true, //user has token or not
            methods:['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        },
        pingTimeout: 60000 //disconnect inactive user after 60 seconds
    });


    //when a new socket user is established
    io.on('connection', (socket)=> {
        console.log(`user connected : ${socket.id}`);
        let userId = null;


        socket.on('user_connected', async(connectingUserId) => {
            try{
                userId = connectingUserId;
                onlineUsers.set(userId, socket.id);
                socket.join(userId);

                await User.findByIdAndUpdate(
                    userId,
                    {
                        isOnline: true,
                        lastSeen: new Date(),
                    }
                );

                //notify all the users that this user is now online
                io.emit('user_status', {userId, isOnline:true});
            }catch(error) {
                console.error('error while handling user connection', error);
                
            }
        })

        //return online status of requested user 
        socket.on('get_user_status', (requestedUserId, callBack) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callBack({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline? new Date() : null,
            })
        })

        //forward message to receiver if online
        socket.on('send_message', async(message) => {
            try{
                const receiverSocketId = onlineUsers.get(message.receiver?._id);
                if(receiverSocketId) {
                    socket.to(receiverSocketId).emit('receive_message', message);
                }
            }
            catch(error) {
                console.error('error sending message', error);
                socket.emit('message_error', {error: 'failed to send message'});
            }
           
        })

        //update messages as read and notify sender
        socket.on("message_read", async({messageIds, senderId}) => {
            try {
                await Message.updateMany(
                    {_id:{$in: messageIds}},
                    {$set:{messageStatus: "read"}}
                );

                const senderSocketId = onlineUsers.get(senderId);
                if(senderSocketId) {
                    messageIds.forEach( (messageId) => {
                        io.to(senderSocketId).emit('message_status_update', {
                            messageId,
                            messageStatus:"read",
                        })
                    })
                }
            } catch (error) {
                console.error('error updating message read status', error);
            }
        })


        //handle typing start event and auto stop after 3 sec
        socket.on('typing_start', ({conversationId, receiverId}) => {
            if(!userId || !conversationId || !receiverId) {
                return ;
            }
            if(!typingUsers.has(userId)) typingUsers.set(userId, {});

            const userTyping = typingUsers.get(userId);

            userTyping[conversationId] = true;

            //clear any existing timeout
            if(userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`])
            }

            //auto-stop after 3s
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false,
                socket.to(receiverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false
                })
            }, 3000);

            //notify receiver
            socket.to(receiverId).emit("user_typing", {
                userId, 
                conversationId,
                isTyping: true
            })

        })

        socket.on('typing_stop', ({conversationId,receiverId}) => {
             if(!userId || !conversationId || !receiverId) {
                return ;
            }
            if(typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false;

                if(userTyping[`${conversation}_timeout`]) {
                    clearTimeout(userTyping[`${conversation}_timeout`]);
                    delete userTyping[`${conversation}_timeout`]
                }
            }

            socket.to(receiverId).emit('user_typing', {
                userId,
                conversationId,
                isTyping: false
            })
        })

        socket.on('add_reactions', async(messageId, emoji, userId, reactionUserId) => {
            try {
                const message = await Message.findById(messageId);
                if(!message) return;

                const existingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === reactionUserId
                )

                if(existingIndex > -1) {
                    const existing = message.reactions[existingIndex];
                    if(existing.emoji === emoji) {
                        //remove the same reactions
                        message.reactions.splice(existingIndex, 1);
                    }
                    else {
                        //if not same then change the reactions
                        message.reactions[existingIndex].emoji = emoji;
                    }
                }
                else {
                    message.reactions.push({user: reactionUserId, emoji});
                }

                await message.save();

                const populatedMessage = await Message.findOne(message?._id)
                .populate('sender', 'username profilePicture')
                .populate('receiver', 'username profilePicture')
                .populate('reactions.user', 'username');

                const reactionUpdated = {
                    messageId,
                    reactions: populatedMessage.reactions,
                }

                const senderSocketId = onlineUsers.get(populatedMessage.sender?._id.toString());
                const receiverSocketId = onlineUsers.get(populatedMessage.receiver?._id.toString());

                if(senderSocketId) io.to(senderSocketId).emit('reaction_update', reactionUpdated);
                if(receiverSocketId) io.to(receiverSocketId).emit('reaction_update', reactionUpdated);
            } catch (error) {
                console.log('error handling reactions', error);
            }
        })

        //handle disconnections and mark user online
        const handleDisconnected = async()=> {
            if(!userId) return;

            try {
                onlineUsers.delete(userId);

                if(typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    Object.keys.forEach( (key) => {
                        if(key.endsWith('_timeout')) clearTimeout(userTyping[key]);
                    })

                    typingUsers.delete(userId);
                }

                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date()
                })

                io.emit('user_status', {
                    userId,
                    isOnline: false,
                    lastSeen: new Date(),
                })

                socket.leave(userId);
                console.log(`user ${userId} disconnected`);

            } catch (error) {
                console.log('error handling disconnections', error);
            }
        }

        //disconnect event 
        socket.on('disconnect', handleDisconnected);

    });

    //attach the online user map to the socket for external users
    io.socketUserMap = onlineUsers;

    return io;


}

module.exports = initializeSocket;