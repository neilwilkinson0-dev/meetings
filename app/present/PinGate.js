"use client";

import { useState } from "react";
import { usePinGate } from "@/lib/event";

export default function PinGate({ children }) {
  const { ok, attempt } = usePinGate();
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  if (ok) return children;

  return (
    <main className="page ev-pin">
      <p className="eyebrow">Presenter</p>
      <h1 className="page-title">Enter PIN</h1>
      <form
        className="ev-pin-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!attempt(value)) {
            setWrong(true);
            setValue("");
          }
        }}
      >
        <input
          className="input"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          placeholder="PIN"
        />
        <button className="btn" type="submit">
          Unlock
        </button>
      </form>
      {wrong && <p className="ev-error">That's not it.</p>}
    </main>
  );
}
