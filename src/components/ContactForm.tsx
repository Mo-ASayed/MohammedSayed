"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Loader2, Send } from "lucide-react";
import { profile } from "../app/data";

/**
 * Enquiry form. The destination address is never in the page source — the form
 * posts to a third-party endpoint (Formspree by default) that holds it and does
 * the spam filtering. Set NEXT_PUBLIC_CONTACT_ENDPOINT to switch it on; without
 * it the section degrades to a LinkedIn call to action rather than breaking.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  if (!ENDPOINT) {
    return (
      <a className="button button-primary" href={profile.linkedin} target="_blank" rel="noreferrer">
        Connect on LinkedIn <ArrowUpRight size={17} aria-hidden="true" />
      </a>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: real people leave this hidden field empty.
    if (data.get("company-website")) {
      setStatus("sent");
      form.reset();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="contact-sent" role="status">
        <Check size={18} aria-hidden="true" /> Message received. I&apos;ll reply from my personal
        address.
      </p>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate={false}>
      <div className="contact-field">
        <label htmlFor="contact-name">Your name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={120} />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-email">Your email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          placeholder="name@company.com"
        />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" rows={4} required maxLength={2000} />
      </div>

      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="company-website">Leave this field empty</label>
        <input id="company-website" name="company-website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="button button-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? (
          <>
            <Loader2 size={17} className="contact-spinner" aria-hidden="true" /> Sending
          </>
        ) : (
          <>
            Send message <Send size={16} aria-hidden="true" />
          </>
        )}
      </button>

      {status === "error" && (
        <p className="contact-error" role="alert">
          That didn&apos;t send. Try again, or reach me on{" "}
          <a href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          .
        </p>
      )}
    </form>
  );
}
