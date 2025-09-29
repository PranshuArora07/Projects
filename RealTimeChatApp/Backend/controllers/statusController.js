const Status = require('../models/Status');
const Message = require('../models/Message');
const {uploadFileToCloudinary} = require("../config/cloudinaryConfig");
const response = require("../utils/responseHandler");


exports.createStatus = async(req, res)=> {
    try{
        const {content, contentType} = req.body;
        const userId = req.user.userId;

        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || "text";
        if(file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if(!uploadFile?.secure_url) {
                return response(res, 400, "failed to upload media");
            }
            mediaUrl = uploadFile?.secure_url;

            if(file.mimetype.startsWith('image')) {
                finalContentType = 'image'
            }
            else if(file.mimetype.startsWith('video')) {
                finalContentType='video';
            }
            else {
                return response(res, 400, 'unsupported file type');
            }
        }
        else if(content?.trim){
            finalContentType = 'text';

        }
        else {
            return response(res, 400, 'message content is required');
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content: content || mediaUrl,
            contentType: finalContentType,
            expiresAt

        })
        await status.save();

        const populateStatus = await Status.findOne(status?._id)
        .populate('user', 'username profilePicture')
        .populate('viewers', 'username profilePicture');


        //socket
        if(req.io && req.socketUserMap) {

            for(const [connectedUserId, socketId] of req.socketUserMap) {
                if(connectedUserId !== userId) {
                    req.io.to(socketId).emit('new_status', populateStatus);
                }
            }
        }


        return response(res, 200, 'status created successfully', populateStatus);
    }
    catch(err) {
        console.error(err);
        console.log('error while creating status');
        return response(res, 500, 'internal server error');
    }
    
}

exports.getStatuses = async(req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt:{$gt:new Date()}
        }).populate('user', 'username profilePicture')
        .populate('viewers', 'username profilePicture')
        .sort({createdAt : -1});

        return response(res, 200, 'statuses retrieved successfully', statuses);
    } catch (error) {
        console.error(error);
        console.log('error while retrieving statuses');
        return response(res, 500, 'internal server error');
    }
}

exports.viewStatus = async(req, res) => {
    try {
        const {statusId} = req.params;
        const userId = req.user.userId;
        
        const status = await Status.findById(statusId);
        if(!status) {
            return response(res, 404, 'status not found');
        }

        if(!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();

            const updatedStatus = await Status.findById(statusId)
            .populate('user', 'username profilePicture')
            .populate('viewers', 'username profilePicture')

            if(req.io && req.socketUserMap) {
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString());
                if(statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        totalViewers: updatedStatus.viewers.length,
                        viewers: updatedStatus.viewers,
                    }
                    req.io.to(statusOwnerSocketId).emit('status_viewed', viewData);
                }
                else{
                    console.log("status owner not connected");
                }
            }
        }
        else {
            console.log('viewer already viewed the status');
        }

        return response(res, 200, 'status viewed successfully');

    } catch (error) {
        console.error(error);
        console.log('error viewing status');
        return response(res, 500, 'internal server error');
    }
}

exports.deleteStatus = async(req, res) => {
    try{
        const {statusId} = req.params;
        const userId = req.user.userId;

        const status = await Status.findById(statusId);
        if(!status) {
            return response(res, 404, 'status not found');
        }
        if(status.user.toString() !== userId) {
            return response(res, 403, 'not authorized to delete this status');
        }

        await status.deleteOne();

        //socket
        if(req.io && req.socketUserMap) {

            for(const [connectedUserId, socketId] of req.socketUserMap) {
                if(connectedUserId !== userId) {
                    req.io.to(socketId).emit('status_deleted', statusId);
                }
            }
        }

        return response(res, 200, 'status deleted successfully');
    }catch(error) {
        console.error(error);
        console.log('error deleting status');
        return response(res, 500, 'internal server error');
    }
}