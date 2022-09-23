import React, { useMemo, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAsync } from "../hooks/useAsync";
import { getPost } from "../services/posts";

const Context = React.createContext();

export const usePost = () => {
    return useContext(Context);
};

export const PostProvider = ({ children }) => {
    const { id } = useParams();
    const { loading, error, value: post } =  useAsync(() => getPost(id), [id]);
    const [comments, setComments] = useState([]);
    const commentsByParentID = useMemo(() => {
        const group = {};
        comments.forEach(comment => {
            group[comment.parentID] ||= [];
            group[comment.parentID].push(comment);
        });
        return group;
    }, [comments]);
    useEffect(() => {
        if (post?.comments == null) return;
        setComments(post.comments);
    }, [post?.comments]);
    const getReplies = parentID => commentsByParentID[parentID];
    const createLocalComment = (comment) => setComments(previousComments => [comment, ...previousComments]);
    const updateLocalComment = (id, message) => setComments(previousComments => {
        return previousComments.map(comment => {
            if (comment.id === id) return { ...comment, message };
            else return comment;
        });
    });
    const deleteLocalComment = (id) => setComments(previousComments => previousComments.filter(comment => comment.id !== id));
    const toggleLocalCommentLike = (id, addLike) => setComments(previousComments => {
        return previousComments.map(comment => {
            if (id === comment.id) {
                if (addLike) return { ...comment, likeCount: comment.likeCount + 1, likedByMe: true };
                else return { ...comment, likeCount: comment.likeCount - 1, likedByMe: false }
            } else return comment; 
        });
    });
    return <Context.Provider value={{ post: { id, ...post }, getReplies, createLocalComment, updateLocalComment, deleteLocalComment, toggleLocalCommentLike, rootComments: commentsByParentID[null] }}>{ loading ? (<h1>Loading</h1>) : error ? (<h1 className="error-msg">{error}</h1>) : children}</Context.Provider>
};