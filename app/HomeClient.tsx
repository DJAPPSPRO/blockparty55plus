"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, HeartHandshake, Home, Mail, MapPin, MessageCircle, Send, ShieldCheck, Users } from "lucide-react";
import type { PostItem, SessionUser } from "@/lib/types";
import styles from "./home.module.css";

export default function HomeClient({ user }: { user: SessionUser }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [openComments, setOpenComments] = useState<number[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [liked, setLiked] = useState<number[]>([]);
  const initials = useMemo(() => user.displayName.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase(), [user.displayName]);

  async function load() {
    setLoading(true);
    const [feedRes, inviteRes] = await Promise.all([fetch("/api/feed"), fetch("/api/invitations")]);
    if (feedRes.ok) {
      const feed = await feedRes.json();
      setPosts(feed.posts);
    }
    if (inviteRes.ok) {
      const inviteData = await inviteRes.json();
      setPendingInvites(inviteData.invitations.filter((x: { response: string }) => x.response === "pending").length);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function publish() {
    const body = draft.trim();
    if (!body) return;
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (response.ok) {
      setDraft("");
      await load();
    }
  }

  async function addComment(postId: number) {
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, body }),
    });
    if (response.ok) {
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      await load();
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>55+</span>
          <div><strong>Block Party 55+</strong><span>Your neighborhood. Your community.</span></div>
        </div>

        <nav className={styles.nav}>
          <a className={`${styles.navItem} ${styles.active}`} href="/"><Home size={24}/>Home</a>
          <button className={styles.navItem}><Users size={24}/>Neighbors</button>
          <button className={styles.navItem}><CalendarDays size={24}/>Events</button>
          <a className={styles.navItem} href="/invitations"><Mail size={24}/>Invitations{pendingInvites > 0 && <span className={styles.badge}>{pendingInvites}</span>}</a>
          <button className={styles.navItem}><HeartHandshake size={24}/>Help</button>
          <button className={styles.navItem}><MessageCircle size={24}/>Messages</button>
        </nav>

        <button className={styles.makePost} onClick={() => document.getElementById("post-box")?.focus()}>+ Make a Post</button>
        <button className={styles.signOut} onClick={signOut}>Sign Out</button>

        <div className={styles.safety}>
          <ShieldCheck size={22}/>
          <div><strong>Safer community</strong><span>Never send money to someone you do not know.</span></div>
        </div>
      </aside>

      <main className={styles.feed}>
        <header className={styles.topbar}>
          <span>YOUR NEIGHBORHOOD</span>
          <h1>Hi {user.displayName} 👋</h1>
          <p>Here is what is happening near you.</p>
        </header>

        <section className={styles.quickRow}>
          <button><Users size={26}/><span><strong>Find Neighbors</strong><small>People nearby</small></span></button>
          <button><CalendarDays size={26}/><span><strong>Local Events</strong><small>See what’s coming up</small></span></button>
          <a href="/invitations"><Mail size={26}/><span><strong>Invitations</strong><small>{pendingInvites ? `${pendingInvites} waiting for you` : "Special event invites"}</small></span></a>
        </section>

        <section className={styles.composer}>
          <div className={styles.avatar}>{initials || "55"}</div>
          <div className={styles.composerBody}>
            <label htmlFor="post-box">Share something with your neighbors</label>
            <textarea id="post-box" value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 500))} placeholder="Example: Does anyone know a good plumber?" />
            <div className={styles.composerFooter}>
              <span>{draft.length}/500</span>
              <button disabled={!draft.trim()} onClick={publish}><Send size={19}/>Post</button>
            </div>
          </div>
        </section>

        <section className={styles.feedTitle}><div><MapPin size={22}/><h2>From your neighborhood</h2></div><span>Newest first</span></section>

        <div className={styles.postList}>
          {loading && <div className={styles.message}>Loading neighborhood posts…</div>}
          {!loading && posts.map((post) => {
            const isLiked = liked.includes(post.id);
            const commentsOpen = openComments.includes(post.id);
            return (
              <article className={styles.post} key={post.id}>
                <div className={styles.postHeader}>
                  <div className={styles.avatar}>{post.authorName.slice(0,2).toUpperCase()}</div>
                  <div><strong>{post.authorName}</strong><span><MapPin size={15}/>{post.location}</span></div>
                </div>
                <p>{post.body}</p>
                <div className={styles.actions}>
                  <button onClick={() => setLiked((current) => isLiked ? current.filter((id) => id !== post.id) : [...current, post.id])}>♥ {isLiked ? "Liked" : "Like"} · {post.likesCount + (isLiked ? 1 : 0)}</button>
                  <button onClick={() => setOpenComments((current) => commentsOpen ? current.filter((id) => id !== post.id) : [...current, post.id])}><MessageCircle size={20}/>Comments · {post.comments.length}</button>
                </div>
                {commentsOpen && (
                  <div className={styles.comments}>
                    {post.comments.length === 0 && <p className={styles.noComments}>No comments yet. You can be the first.</p>}
                    {post.comments.map((comment) => <div className={styles.comment} key={comment.id}><strong>{comment.authorName}</strong><span>{comment.body}</span></div>)}
                    <div className={styles.commentBox}>
                      <textarea value={commentDrafts[post.id] || ""} onChange={(e) => setCommentDrafts((current) => ({...current, [post.id]: e.target.value.slice(0, 300)}))} placeholder="Write a friendly comment…" />
                      <button disabled={!commentDrafts[post.id]?.trim()} onClick={() => addComment(post.id)}>Comment</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <aside className={styles.rightRail}>
        <section className={styles.card}>
          <h2>Special Invitations</h2>
          <p>{pendingInvites ? `You have ${pendingInvites} invitation waiting for your answer.` : "Private event invitations will appear here."}</p>
          <a className={styles.fullButton} href="/invitations"><Mail size={20}/>View invitations</a>
        </section>
        <section className={styles.card}>
          <h2>Need Help?</h2>
          <p>Ask a neighbor for a ride, recommendation, small favor, or local advice.</p>
          <button className={styles.fullButton}><HeartHandshake size={20}/>Ask for help</button>
        </section>
        <section className={styles.card}>
          <h2>Block Party 55+</h2>
          <p>Your neighborhood. Your people. Your community.</p>
        </section>
      </aside>

      <nav className={styles.mobileNav}>
        <a className={styles.mobileActive} href="/"><Home size={24}/><span>Home</span></a>
        <button><CalendarDays size={24}/><span>Events</span></button>
        <a href="/invitations"><Mail size={24}/><span>Invites</span></a>
        <button><HeartHandshake size={24}/><span>Help</span></button>
        <button><MessageCircle size={24}/><span>Messages</span></button>
      </nav>
    </div>
  );
}
