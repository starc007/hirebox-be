Build the backend for a B2B SaaS called Hirebox, an email-first Hiring Inbox for small and mid-sized companies.

The system connects to a user’s Gmail or Outlook using OAuth and only scans hiring-related emails (resumes, applications, LinkedIn/Naukri forwards).

Hiring emails are automatically grouped into candidate threads, where each candidate has a single timeline containing:

Incoming emails

Replies sent from the user’s real inbox

Notes

Interview details

Status changes (new, shortlisted, interview, offered, rejected)

The backend must:

Support secure email connection (Gmail & Outlook)

Ingest and de-duplicate hiring emails

Store resumes and extract text asynchronously

Allow HR to reply to candidates from their own email

Send optional auto-replies using selected templates (only on first contact)

Support lightweight interview scheduling via email

Run AI jobs asynchronously for tagging and classification

Ensure company-level data isolation, audit logs, and privacy controls

Use Node.js (TypeScript) with MongoDB, background queues, and a clean, production-ready architecture.
Avoid building

## TECH STACK

Node.js + TypeScript

Express

Mongoose

Redis + BullMQ

Gmail API

cloudflare R2
