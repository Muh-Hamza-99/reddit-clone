import { useState } from "react";

const CommentForm = ({ loading, error, onSubmit, autoFocus = false, initialValue = "" }) => {
  const [message, setMessage] = useState(initialValue);
  const handleSubmit = event => {
    event.preventDefault();
    onSubmit(message).then(() => setMessage(""));
  };
  return (
    <form onSubmit={handleSubmit}>
        <div className="comment-form-row">
            <textarea autoFocus={autoFocus} className="message-input" onChange={event => setMessage(event.target.value)} value={message}/>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Loading": "Post"}</button>
        </div>
        <div className="error-msg">{error}</div>
    </form>
  );
};

export default CommentForm;