import { makeRequest } from "./makeRequest"

export const createComment = ({ postID, message, parentID }) => {
    return makeRequest(`posts/${postID}/comments`, { method: "POST", data: { message, parentID } });
};

export const updateComment = ({ postID, message, commentID }) => {
    return makeRequest(`posts/${postID}/comments/${commentID}`, { method: "PUT", data: { message } });
};

export const deleteComment = ({ postID, commentID }) => {
    return makeRequest(`posts/${postID}/comments/${commentID}`, { method: "DELETE" });
};

export const toggleCommentLike = ({ commentID, postID }) => {
    return makeRequest(`posts/${postID}/comments/${commentID}/toggleLike`, { method: "POST" });
};