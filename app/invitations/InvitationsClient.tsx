"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Check, ChevronLeft, Clock, HelpCircle, Mail, MapPin, X } from "lucide-react";
import type { InvitationItem, InvitationResponse } from "@/lib/types";
import styles from "./invitations.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function label(response: InvitationResponse) {
  if (response === "accepted") return "You’re going";
  if (response === "maybe") return "You said maybe";
  if (response === "declined") return "You declined";
  return "Please respond";
}

export default function InvitationsClient() {
  const [items, setItems] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/invitations");
    if (response.ok) {
      const data = await response.json();
      setItems(data.invitations);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function respond(invitationId: number, response: Exclude<InvitationResponse, "pending">) {
    setBusyId(invitationId);
    const result = await fetch("/api/invitations/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId, response }),
    });
    if (result.ok) await load();
    setBusyId(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.back} href="/"><ChevronLeft size={22}/>Home</a>
        <div className={styles.title}>
          <span className={styles.icon}><Mail size={28}/></span>
          <div><h1>Invitations</h1><p>Special events from people in your Block Party 55+ community.</p></div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <h2>Special Events</h2>
          <p>You decide which invitations you want to accept. Your answer is saved automatically.</p>
        </section>

        {loading && <div className={styles.message}>Loading your invitations…</div>}

        <div className={styles.list}>
          {items.map((invite) => (
            <article className={styles.card} key={invite.id}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.from}>INVITATION FROM {invite.hostName.toUpperCase()}</span>
                  <h2>{invite.title}</h2>
                </div>
                <span className={`${styles.status} ${styles[invite.response]}`}>{label(invite.response)}</span>
              </div>

              <p className={styles.details}>{invite.details}</p>

              <div className={styles.infoGrid}>
                <div><CalendarDays size={22}/><span><strong>Date & time</strong>{formatDate(invite.eventAt)}</span></div>
                <div><MapPin size={22}/><span><strong>Where</strong>{invite.location}</span></div>
              </div>

              <div className={styles.note}><Clock size={20}/><span>You can change your answer later.</span></div>

              <div className={styles.actions}>
                <button onClick={() => respond(invite.id, "accepted")} disabled={busyId === invite.id}><Check size={20}/>Accept</button>
                <button className={styles.outline} onClick={() => respond(invite.id, "maybe")} disabled={busyId === invite.id}><HelpCircle size={20}/>Maybe</button>
                <button className={styles.ghost} onClick={() => respond(invite.id, "declined")} disabled={busyId === invite.id}><X size={20}/>Decline</button>
              </div>
            </article>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className={styles.empty}><Mail size={38}/><h2>No invitations right now</h2><p>When a neighbor invites you to a special event, it will appear here.</p></div>
        )}
      </main>
    </div>
  );
}
