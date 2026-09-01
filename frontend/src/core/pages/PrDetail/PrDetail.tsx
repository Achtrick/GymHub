import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { mediaUrl } from "../../api/apiClient";
import {
  addComment,
  deleteComment,
  getComments,
  getPrById,
  locateComment,
  toggleLike,
  type Comment,
  type PrSubmission,
} from "../../api/prs";
import { useAuth } from "../../auth/useAuth";
import Avatar from "../../Components/Controls/Avatar/Avatar";
import ConfirmDialog from "../../Components/Controls/ConfirmDialog/ConfirmDialog";
import { HeartIcon } from "../../Components/Controls/Icons";
import MentionInput from "../../Components/Controls/MentionInput/MentionInput";
import { useScrollLoadMore } from "../../hooks/useScrollLoadMore";
import { encodeMentions, parseMentions, type Mention } from "../../utils/mentions";
import styles from "./PrDetail.module.scss";

const LIFT_LABELS: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

const PAGE_SIZE = 12;

interface ReplyTarget {
  commentId: string;
  fullName: string;
}

function rootCount(list: Comment[]) {
  return list.filter((c) => !c.parentCommentId).length;
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
  highlighted,
  onReply,
  onDelete,
  repliesToggle,
}: {
  comment: Comment;
  canDelete: boolean;
  highlighted: boolean;
  onReply: () => void;
  onDelete: () => void;
  repliesToggle?: RepliesToggle;
}) {
  return (
    <div id={`comment-${comment.id}`} className={highlighted ? styles.highlighted : undefined}>
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
    </div>
  );
}

function PrDetail() {
  const { prId } = useParams<{ prId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const [pr, setPr] = useState<PrSubmission | null>(null);
  const [prError, setPrError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const commentsRef = useRef<Comment[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const hasMoreCommentsRef = useRef(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const loadingCommentsRef = useRef(false);

  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [draftMentions, setDraftMentions] = useState<Mention[]>([]);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);

  const loadCommentsPage = useCallback(
    async (skip: number, limit: number) => {
      if (!prId || loadingCommentsRef.current) return;
      loadingCommentsRef.current = true;
      setIsLoadingComments(true);
      try {
        const page = await getComments(prId, skip, limit);
        const existingIds = new Set(commentsRef.current.map((c) => c.id));
        commentsRef.current = [
          ...commentsRef.current,
          ...page.filter((c) => !existingIds.has(c.id)),
        ];
        setComments([...commentsRef.current]);
        if (rootCount(page) < limit) {
          hasMoreCommentsRef.current = false;
          setHasMoreComments(false);
        }
      } catch {
        // no-op
      } finally {
        loadingCommentsRef.current = false;
        setIsLoadingComments(false);
      }
    },
    [prId],
  );

  const loadMoreComments = useCallback(() => {
    if (loadingCommentsRef.current || !hasMoreCommentsRef.current) return;
    void loadCommentsPage(rootCount(commentsRef.current), PAGE_SIZE);
  }, [loadCommentsPage]);

  useScrollLoadMore(pageRef, loadMoreComments, hasMoreComments && !isLoadingComments);

  useEffect(() => {
    if (!prId) return;

    commentsRef.current = [];
    hasMoreCommentsRef.current = true;

    void Promise.resolve().then(() => {
      setPr(null);
      setPrError(null);
      setComments([]);
      setHasMoreComments(true);
    });

    getPrById(prId)
      .then(setPr)
      .catch(() => setPrError("This PR couldn't be found, or isn't visible to you."));

    const targetCommentId = searchParams.get("commentId");
    if (!targetCommentId) {
      void loadCommentsPage(0, PAGE_SIZE);
      return;
    }

    locateComment(prId, targetCommentId)
      .then(({ rootCommentId, position }) => {
        const neededLimit = Math.max(PAGE_SIZE, Math.ceil((position + 1) / PAGE_SIZE) * PAGE_SIZE);
        return loadCommentsPage(0, neededLimit).then(() => rootCommentId);
      })
      .then((rootCommentId) => {
        setExpandedReplies((prev) => new Set(prev).add(rootCommentId));
        setHighlightedCommentId(targetCommentId);
        requestAnimationFrame(() => {
          document
            .getElementById(`comment-${targetCommentId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      })
      .catch(() => {
        void loadCommentsPage(0, PAGE_SIZE);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prId]);

  useEffect(() => {
    if (!highlightedCommentId) return;
    const timer = setTimeout(() => setHighlightedCommentId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightedCommentId]);

  const handleLike = async () => {
    if (!pr) return;
    setPr((prev) =>
      prev
        ? {
            ...prev,
            likedByMe: !prev.likedByMe,
            likeCount: prev.likeCount + (prev.likedByMe ? -1 : 1),
          }
        : prev,
    );
    try {
      const result = await toggleLike(pr.id);
      setPr((prev) => (prev ? { ...prev, likedByMe: result.liked, likeCount: result.likeCount } : prev));
    } catch {
      setPr((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: !prev.likedByMe,
              likeCount: prev.likeCount + (prev.likedByMe ? -1 : 1),
            }
          : prev,
      );
    }
  };

  const resetComposer = () => {
    setDraft("");
    setDraftMentions([]);
    setReplyTarget(null);
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

  const handleAddComment = async () => {
    if (!pr) return;
    const text = encodeMentions(draft, draftMentions).trim();
    if (!text) return;
    setIsPostingComment(true);
    try {
      const comment = await addComment(pr.id, text, replyTarget?.commentId);
      commentsRef.current = [...commentsRef.current, comment];
      setComments([...commentsRef.current]);
      setPr((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
      resetComposer();
    } finally {
      setIsPostingComment(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!pr || !pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      const deletedIds = await deleteComment(pr.id, target.id);
      commentsRef.current = commentsRef.current.filter((c) => !deletedIds.includes(c.id));
      setComments([...commentsRef.current]);
      setPr((prev) =>
        prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - deletedIds.length) } : prev,
      );
    } catch {
      // no-op — leave the comment in place if the delete failed
    }
  };

  if (prError) {
    return (
      <div className={styles.page} ref={pageRef}>
        <Link to="/" className={styles.back}>
          ← Back
        </Link>
        <p className={styles.empty}>{prError}</p>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className={styles.page} ref={pageRef}>
        <p className={styles.empty}>Loading…</p>
      </div>
    );
  }

  const { topLevel, repliesByParent } = groupComments(comments);
  const canDelete = (c: Comment) => user?.id === c.userId || user?.role === "admin";

  return (
    <div className={styles.page} ref={pageRef}>
      <Link to="/" className={styles.back}>
        ← Back
      </Link>

      <div className={styles.videoWrap}>
        <video className={styles.video} src={mediaUrl(pr.videoUrl)} controls playsInline autoPlay />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Link to={`/profile/${pr.userId}`} className={styles.lifter}>
            <Avatar name={pr.userFullName} photoUrl={pr.userProfilePictureUrl} size="small" />
            <span>{pr.userFullName}</span>
          </Link>
          <span className={styles.liftBadge}>
            {LIFT_LABELS[pr.liftType] ?? pr.liftType} · {pr.weightKg}kg
          </span>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} onClick={handleLike}>
            <HeartIcon filled={pr.likedByMe} className={pr.likedByMe ? styles.liked : undefined} />
            <span>{pr.likeCount}</span>
          </button>
          <span className={styles.commentCountLabel}>
            {pr.commentCount} comment{pr.commentCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className={styles.comments}>
          {topLevel.length === 0 && !isLoadingComments && (
            <p className={styles.hint}>No comments yet. Be the first to say something.</p>
          )}

          {topLevel.map((comment) => {
            const replies = repliesByParent.get(comment.id) ?? [];
            const repliesShown = expandedReplies.has(comment.id);

            return (
              <div className={styles.commentThread} key={comment.id}>
                <CommentRow
                  comment={comment}
                  canDelete={canDelete(comment)}
                  highlighted={highlightedCommentId === comment.id}
                  onReply={() => handleReply(comment)}
                  onDelete={() => setPendingDelete(comment)}
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
                        highlighted={highlightedCommentId === reply.id}
                        onReply={() => handleReply(reply)}
                        onDelete={() => setPendingDelete(reply)}
                      />
                    </div>
                  ))}
              </div>
            );
          })}

          {isLoadingComments && <p className={styles.hint}>Loading comments…</p>}
          {!hasMoreComments && comments.length > 0 && (
            <p className={styles.hint}>You've reached the end.</p>
          )}

          <form
            className={styles.commentForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleAddComment();
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
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete comment"
          message={
            pendingDelete.parentCommentId
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

export default PrDetail;
