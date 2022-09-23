import { useState } from "react";
import { FaHeart, FaReply, FaEdit, FaTrash, FaRegHeart } from "react-icons/fa";

import IconButton from "./IconButton";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";

import { usePost } from "../contexts/PostContext";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment, updateComment, deleteComment, toggleCommentLike } from "../services/comments";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

const Comment = ({ id, message, user, createdAt, likeCount, likedByMe }) => {
  const { post, getReplies, createLocalComment, updateLocalComment, deleteLocalComment, toggleLocalCommentLike } = usePost();
  const childComments = getReplies(id);
  const [areChildrenHidden, setAreChildrenHidden] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const createCommentFn = useAsyncFn(createComment);
  const updateCommentFn = useAsyncFn(updateComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const toggleCommentLikeFn = useAsyncFn(toggleCommentLike);
  const onCommentReply = message => {
    return createCommentFn.execute({ postID: post.id, message, parentID: id }).then(comment => {
        setIsReplying(false);
        createLocalComment(comment);
    });
  };
  const onCommentUpdate = message => {
    return updateCommentFn.execute({ postID: post.id, message, commentID: id }).then(comment => {
        setIsEditing(false);
        updateLocalComment({ id, message: comment.message });
    });
  };
  const onCommentDelete = () => {
    return deleteCommentFn.execute({ postID: post.id, commentID: id }).then(comment => {
        deleteLocalComment(comment.id);
    });
  };
  const onToggleCommentLike = () => {
    return toggleCommentLikeFn.execute({ postID: post.id, commentID: id }).then(({ addLike }) => toggleLocalCommentLike(id, addLike));
  };
  return <>
    <div className="comment">
        <div className="header">
            <span className="name">{user.name}</span>
            <span className="date">{dateFormatter.format(Date.parse(createdAt))}</span>
        </div>
        {isEditing ? <CommentForm autoFocus initialValue={message} onSubmit={onCommentUpdate} loading={updateCommentFn.loading} error={updateCommentFn.error} /> : <div className="message">{message}</div> }
        <div className="footer">
            <IconButton onClick={onToggleCommentLike} disabled={toggleCommentLikeFn.loading} Icon={likedByMe ? FaHeart : FaRegHeart } aria-label={likedByMe ? "Unlike" : "Like"}>{likeCount}</IconButton>
            <IconButton onClick={() => setIsReplying(previous => !previous)} isActive={isReplying} Icon={FaReply} aria-label={isReplying ? "Cancel Reply" : "Reply"} />
            <IconButton onClick={() => setIsEditing(previous => !previous)} isActive={isEditing} Icon={FaEdit} aria-label={isEditing ? "Cancel Edit" : "Edit"} />
            <IconButton onClick={onCommentDelete} disabled={deleteCommentFn.loading} Icon={FaTrash} aria-label="Trash" color="danger" />
        </div>
        {deleteCommentFn.error && (<div className="error-msg mt-1">{deleteCommentFn.error}</div>)}
    </div>
    {isReplying && (<div className="mt-1 ml-3"><CommentForm autoFocus onSubmit={onCommentReply} loading={createCommentFn.loading} error={createCommentFn.error} /></div>)}
    {childComments?.length > 0 && (
        <>
            <div className={`nested-comments-stack ${areChildrenHidden ? "hide": ""}`}>
                <button className="collapse-line" aria-label="Hide Replies" onClick={() => setAreChildrenHidden(true)} />
                <div className="nested-comments">
                    <CommentList comments={childComments} />
                </div>
            </div>
            <button className={`btn mt-1 ${!areChildrenHidden ? "hide": ""}`} onClick={() => setAreChildrenHidden(false)}>Show Replies</button>
        </>
    )}
  </>
};

export default Comment;