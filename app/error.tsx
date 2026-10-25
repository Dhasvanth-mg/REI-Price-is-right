"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-page">
      <span className="eyebrow">A SMALL DETOUR</span>
      <h1>Let’s try that again.</h1>
      <p>Something interrupted the page. Your saved room is still there.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <Link href="/">Back to home</Link>
    </main>
  );
}
