import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/apiClient";
import {
  addComment,
  deleteComment,
  getComments,
  getFeed,
  toggleLike,
  type Comment,
} from "../../api/prs";
import { useAuth } from "../../auth/useAuth";
import Avatar from "../../Components/Controls/Avatar/Avatar";
import ConfirmDialog from "../../Components/Controls/ConfirmDialog/ConfirmDialog";
import { CommentIcon, HeartIcon } from "../../Components/Controls/Icons";
import MentionInput from "../../Components/Controls/MentionInput/MentionInput";
import { useInfiniteList } from "../../hooks/useInfiniteList";
import { useScrollLoadMore } from "../../hooks/useScrollLoadMore";
import { encodeMentions, parseMentions, type Mention } from "../../utils/mentions";
import styles from "./Feed.module.scss";

const LIFT_LABELS: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

interface ReplyTarget {
  commentId: string;
  fullName: string;
}

function groupComments(comments: Comment[]) {
  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = new Map<string, Comment[]>();
  for (const comment of comments) {
    if (!comment.parentCommentId) continue;
    const list = repliesByParent.get(comment.parentCommentId) ?? [];
    list.push(comment);
    repliesByParent.set(comment.parentCommentId, list);
  }
  return { topLevel, repliesByParent };
}

function CommentText({ text }: { text: string }) {
  return (
    <>
      {parseMentions(text).map((segment, index) =>
        typeof segment === "string" ? (
          <span key={index}>{segment}</span>
        ) : (
          <Link key={index} to={`/profile/${segment.userId}`} className={styles.mention}>
            @{segment.fullName}
          </Link>
        ),
      )}
    </>
  );
}

interface RepliesToggle {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}

function CommentRow({
  comment,
  canDelete,
  onReply,
  onDelete,
  repliesToggle,
}: {
  comment: Comment;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
  repliesToggle?: RepliesToggle;
}) {
  return (
    <>
      <p className={styles.comment}>
        <strong>{comment.userFullName}</strong> <CommentText text={comment.text} />
      </p>
      <div className={styles.commentMeta}>
        <button type="button" className={styles.replyButton} onClick={onReply}>
          Reply
        </button>
        {repliesToggle && repliesToggle.count > 0 && (
          <button type="button" className={styles.replyButton} onClick={repliesToggle.onToggle}>
            {repliesToggle.expanded
              ? "Hide replies"
              : `See ${repliesToggle.count} ${repliesToggle.count === 1 ? "reply" : "replies"}`}
          </button>
        )}
        {canDelete && (
          <button type="button" className={styles.deleteButton} onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </>
  );
}

function Feed() {
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const { items, hasMore, isLoadingMore, error, loadMore, mutate } = useInfiniteList({
    fetchPage: getFeed,
  });
  useScrollLoadMore(pageRef, loadMore, hasMore && !isLoadingMore);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentsByPr, setCommentsByPr] = useState<Record<string, Comment[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [draftMentions, setDraftMentions] = useState<Mention[]>([]);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ prId: string; comment: Comment } | null>(
    null,
  );
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleLike = async (id: string) => {
    mutate((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likeCount: item.likeCount + (item.likedByMe ? -1 : 1),
            }
          : item,
      ),
    );
    try {
      const result = await toggleLike(id);
      mutate((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, likedByMe: result.liked, likeCount: result.likeCount }
            : item,
        ),
      );
    } catch {
      mutate((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                likedByMe: !item.likedByMe,
                likeCount: item.likeCount + (item.likedByMe ? -1 : 1),
              }
            : item,
        ),
      );
    }
  };

  const resetComposer = () => {
    setDraft("");
    setDraftMentions([]);
    setReplyTarget(null);
  };

  const toggleComments = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    resetComposer();
    if (!commentsByPr[id]) {
      const comments = await getComments(id);
      setCommentsByPr((prev) => ({ ...prev, [id]: comments }));
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReply = (comment: Comment) => {
    setReplyTarget({ commentId: comment.id, fullName: comment.userFullName });
    setDraft(`@${comment.userFullName} `);
    setDraftMentions([{ userId: comment.userId, fullName: comment.userFullName }]);
    commentInputRef.current?.focus();
  };

  const handleAddComment = async (id: string) => {
    const text = encodeMentions(draft, draftMentions).trim();
    if (!text) return;
    setIsPostingComment(true);
    try {
      const comment = await addComment(id, text, replyTarget?.commentId);
      setCommentsByPr((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), comment] }));
      mutate((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, commentCount: item.commentCount + 1 } : item,
        ),
      );
      resetComposer();
    } finally {
      setIsPostingComment(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!pendingDelete) return;
    const { prId, comment } = pendingDelete;
    setPendingDelete(null);
    try {
      const deletedIds = await deleteComment(prId, comment.id);
      setCommentsByPr((prev) => ({
        ...prev,
        [prId]: (prev[prId] ?? []).filter((c) => !deletedIds.includes(c.id)),
      }));
      mutate((prev) =>
        prev.map((item) =>
          item.id === prId
            ? { ...item, commentCount: Math.max(0, item.commentCount - deletedIds.length) }
            : item,
        ),
      );
    } catch {
      // no-op — leave the comment in place if the delete failed
    }
  };

  if (error && !items) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>{error}</p>
      </div>
    );
  }

  if (!items) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Loading feed…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>No approved lifts yet. Be the first to submit a PR!</p>
      </div>
    );
  }

  return (
    <div className={styles.page} ref={pageRef}>
      {items.map((item) => {
        const { topLevel, repliesByParent } = groupComments(commentsByPr[item.id] ?? []);

        return (
          <article className={styles.card} key={item.id}>
            <video
              className={styles.video}
              src={mediaUrl(item.videoUrl)}
              controls
              playsInline
              preload="metadata"
            />
            <div className={styles.body}>
              <div className={styles.meta}>
                <Link to={`/profile/${item.userId}`} className={styles.lifter}>
                  <Avatar
                    name={item.userFullName}
                    photoUrl={item.userProfilePictureUrl}
                    size="small"
                  />
                  <span>{item.userFullName}</span>
                </Link>
                <span className={styles.liftBadge}>
                  {LIFT_LABELS[item.liftType] ?? item.liftType} · {item.weightKg}kg
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleLike(item.id)}
                >
                  <HeartIcon
                    filled={item.likedByMe}
                    className={item.likedByMe ? styles.liked : undefined}
                  />
                  <span>{item.likeCount}</span>
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => toggleComments(item.id)}
                >
                  <CommentIcon />
                  <span>{item.commentCount}</span>
                </button>
              </div>

              {expandedId === item.id && (
                <div className={styles.comments}>
                  {topLevel.map((comment) => {
                    const replies = repliesByParent.get(comment.id) ?? [];
                    const repliesShown = expandedReplies.has(comment.id);

                    const canDelete = (c: Comment) =>
                      user?.id === c.userId || user?.role === "admin";

                    return (
                      <div className={styles.commentThread} key={comment.id}>
                        <CommentRow
                          comment={comment}
                          canDelete={canDelete(comment)}
                          onReply={() => handleReply(comment)}
                          onDelete={() => setPendingDelete({ prId: item.id, comment })}
                          repliesToggle={{
                            count: replies.length,
                            expanded: repliesShown,
                            onToggle: () => toggleReplies(comment.id),
                          }}
                        />

                        {repliesShown &&
                          replies.map((reply) => (
                            <div className={styles.reply} key={reply.id}>
                              <CommentRow
                                comment={reply}
                                canDelete={canDelete(reply)}
                                onReply={() => handleReply(reply)}
                                onDelete={() => setPendingDelete({ prId: item.id, comment: reply })}
                              />
                            </div>
                          ))}
                      </div>
                    );
                  })}

                  {item.commentCount > 0 && (
                    <a
                      href={`/prs/${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.viewFullPost}
                    >
                      View full post ↗
                    </a>
                  )}

                  <form
                    className={styles.commentForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment(item.id);
                    }}
                  >
                    <div className={styles.composer}>
                      {replyTarget && (
                        <div className={styles.replyingTo}>
                          Replying to {replyTarget.fullName}
                          <button type="button" onClick={resetComposer}>
                            Cancel
                          </button>
                        </div>
                      )}
                      <div className={styles.composerRow}>
                        <MentionInput
                          value={draft}
                          mentions={draftMentions}
                          onChange={(value, mentions) => {
                            setDraft(value);
                            setDraftMentions(mentions);
                          }}
                          placeholder="Add a comment… use @ to mention"
                          inputRef={commentInputRef}
                        />
                        <button type="submit" disabled={isPostingComment || !draft.trim()}>
                          Post
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {isLoadingMore && <p className={styles.empty}>Loading more…</p>}
      {error && items.length > 0 && <p className={styles.empty}>{error}</p>}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete comment"
          message={
            pendingDelete.comment.parentCommentId
              ? "Delete this reply? This can't be undone."
              : "Delete this comment? Its replies will be deleted too. This can't be undone."
          }
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteComment}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

export default Feed;
