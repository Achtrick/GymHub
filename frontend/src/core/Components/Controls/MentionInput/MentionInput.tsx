import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { searchUsers, type UserMention } from "../../../api/users";
import type { Mention } from "../../../utils/mentions";
import Avatar from "../Avatar/Avatar";
import styles from "./MentionInput.module.scss";

interface MentionInputProps {
  value: string;
  mentions: Mention[];
  onChange: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onEnter?: () => void;
}

function findTrigger(text: string, cursor: number): { at: number; query: string } | null {
  const uptoCursor = text.slice(0, cursor);
  const at = uptoCursor.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(uptoCursor[at - 1])) return null;
  const query = uptoCursor.slice(at + 1);
  if (/\s/.test(query)) return null;
  return { at, query };
}

function MentionInput({
  value,
  mentions,
  onChange,
  placeholder,
  autoFocus,
  disabled,
  inputRef: externalRef,
  onEnter,
}: MentionInputProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? localRef;

  const [triggerIndex, setTriggerIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserMention[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (triggerIndex === null) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(query)
        .then((users) => {
          if (!cancelled) setResults(users);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [triggerIndex, query]);

  const closeDropdown = () => {
    setTriggerIndex(null);
    setQuery("");
    setResults([]);
  };

  const selectMention = (user: UserMention) => {
    if (triggerIndex === null || !inputRef.current) return;
    const cursor = inputRef.current.selectionStart ?? value.length;
    const before = value.slice(0, triggerIndex);
    const after = value.slice(cursor);
    const insertion = `@${user.fullName} `;
    const nextValue = `${before}${insertion}${after}`;

    onChange(nextValue, [...mentions, { userId: user.id, fullName: user.fullName }]);
    closeDropdown();

    requestAnimationFrame(() => {
      const pos = before.length + insertion.length;
      inputRef.current?.setSelectionRange(pos, pos);
      inputRef.current?.focus();
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    const cursor = event.target.selectionStart ?? text.length;
    const survivingMentions = mentions.filter((m) => text.includes(`@${m.fullName}`));
    onChange(text, survivingMentions);

    const trigger = findTrigger(text, cursor);
    if (trigger) {
      setTriggerIndex(trigger.at);
      setQuery(trigger.query);
      setActiveIndex(0);
    } else {
      closeDropdown();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (triggerIndex !== null && results.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectMention(results[activeIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown();
        return;
      }
    }
    if (event.key === "Enter" && onEnter) {
      onEnter();
    }
  };

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(closeDropdown, 120)}
      />
      {triggerIndex !== null && results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map((user, index) => (
            <button
              type="button"
              key={user.id}
              className={index === activeIndex ? styles.optionActive : styles.option}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectMention(user)}
            >
              <Avatar name={user.fullName} photoUrl={user.profilePictureUrl} size="small" />
              <span>{user.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MentionInput;
