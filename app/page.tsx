"use client"

import { useState } from "react"

/* =========================
   CONFIG VERCEL SAFE RUNTIME
========================= */
// Optionnel si tu mets ce fichier dans /app/page.tsx
export const runtime = "nodejs"

/* =========================
   UTIL: HEX → BYTES
========================= */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)

  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  }

  return bytes
}

/* =========================
   ED25519 VERIFY FIXED
========================= */
async function verifyEd25519(
  sig: string,
  msg: string,
  pk: string
): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false

    const publicKey = hexToBytes(pk)
    const signature = hexToBytes(sig)
    const message = new TextEncoder().encode(msg)

    const key = await crypto.subtle.importKey(
      "raw",
      publicKey as BufferSource,
      { name: "Ed25519" },
      false,
      ["verify"]
    )

    return await crypto.subtle.verify(
      "Ed25519",
      key,
      signature,
      message
    )
  } catch (err) {
    console.error("verifyEd25519 error:", err)
    return false
  }
}

/* =========================
   PETRA WALLET CONNECT
========================= */
function usePetraWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const connect = async () => {
    try {
      if (typeof window === "undefined") return

      const wallet = (window as any).aptos

      if (!wallet) {
        alert("Installe Petra Wallet")
        return
      }

      const res = await wallet.connect()

      setAddress(res.address)
      setConnected(true)
    } catch (e) {
      console.error("Wallet connect error:", e)
    }
  }

  const disconnect = async () => {
    try {
      const wallet = (window as any).aptos
      if (wallet) await wallet.disconnect()

      setAddress(null)
      setConnected(false)
    } catch (e) {
      console.error(e)
    }
  }

  return {
    address,
    connected,
    connect,
    disconnect,
  }
}

/* =========================
   UI PAGE
========================= */
export default function Page() {
  const { address, connect, disconnect, connected } = usePetraWallet()

  const [msg, setMsg] = useState("")
  const [sig, setSig] = useState("")
  const [pk, setPk] = useState("")
  const [result, setResult] = useState<string>("")

  const handleVerify = async () => {
    const ok = await verifyEd25519(sig, msg, pk)
    setResult(ok ? "✅ Signature valid" : "❌ Invalid signature")
  }

  return (
    <main style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🚀 Petra Wallet + Ed25519 Verify</h1>

      {/* WALLET SECTION */}
      <section style={{ marginBottom: 30 }}>
        <h2>Wallet</h2>

        {connected ? (
          <>
            <p>Connected: {address}</p>
            <button onClick={disconnect}>Disconnect</button>
          </>
        ) : (
          <button onClick={connect}>Connect Petra</button>
        )}
      </section>

      {/* VERIFY SECTION */}
      <section>
        <h2>Verify Signature</h2>

        <input
          placeholder="Message"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          style={{ display: "block", marginBottom: 10, width: 300 }}
        />

        <input
          placeholder="Signature (hex)"
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          style={{ display: "block", marginBottom: 10, width: 300 }}
        />

        <input
          placeholder="Public Key (hex)"
          value={pk}
          onChange={(e) => setPk(e.target.value)}
          style={{ display: "block", marginBottom: 10, width: 300 }}
        />

        <button onClick={handleVerify}>Verify</button>

        {result && <p style={{ marginTop: 10 }}>{result}</p>
      </section>
    </main>
  )
        }
