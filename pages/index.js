import Head from "next/head";
import { useState } from "react";

const exampleAddress = "0x3F20EBe6AB8CCdf07a77bFbF16530d30B2504E12"; // example

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);

  const isValidEvm = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr?.trim() || "");

  const handleCheck = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    const addr = wallet.trim();
    if (!isValidEvm(addr)) {
      setErrorMsg("Invalid EVM address. Expected 0x followed by 40 hex characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/irys?wallet=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data?.error || "Unknown server error.");
      }
      setResult(data);
    } catch (err) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Irys Storage Upload Checker</title>
        <meta
          name="description"
          content="Paste an EVM wallet to see how many files it uploaded on Irys and open items via the public gateway."
        />
      </Head>

      <main className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-xl mx-auto px-4 py-10">
          {/* Top bar with EasyNode logo */}
          <div className="mb-6 flex items-center justify-between">
            <a
              href="https://app.easy-node.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
              aria-label="Go to EasyNode"
            >
              <img src="/easynode-logo.svg" alt="EasyNode" className="h-6 w-auto" />
            </a>
          </div>

          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Irys Storage Upload Checker</h1>
            <p className="text-sm text-gray-600 mt-1">
              Enter an EVM wallet address, then click <span className="font-semibold">Check</span> to
              list uploads (Devnet by default).
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Irys is a programmable datachain for permanent storage that makes data directly usable by on-chain apps.
            </p>
          </header>

          <form onSubmit={handleCheck} className="space-y-3 bg-white p-4 rounded-2xl shadow">
            <label htmlFor="wallet" className="block text-sm font-medium">
              EVM Wallet Address
            </label>
            <input
              id="wallet"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck="false"
              placeholder={exampleAddress}
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-0 px-4 py-2 text-sm"
            />

            <button
              type="submit"
              className="w-full rounded-xl px-4 py-2 text-sm font-semibold bg-gray-900 text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Checking…" : "Check"}
            </button>

            {errorMsg && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}
          </form>

          {result && (
            <section className="mt-8 bg-white p-4 rounded-2xl shadow">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-lg font-semibold">Result</h2>
                <span className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{result.total}</span>
                  {result.partial ? (
                    <em className="ml-2 text-amber-600">(partial: limit reached)</em>
                  ) : null}
                </span>
              </div>

              {result.urls?.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {result.ids.map((id, i) => (
                    <li key={id} className="flex items-center justify-between gap-3">
                      <code className="text-xs break-all bg-gray-100 rounded px-2 py-1">{id}</code>
                      <a
                        href={result.urls[i]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50"
                      >
                        Open in Gateway
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 mt-3">No uploads found.</p>
              )}
            </section>
          )}

          <footer className="mt-10 text-xs text-gray-500">
            <p>
              Gateway: <code>https://gateway.irys.xyz/&lt;id&gt;</code> — GraphQL configurable via{" "}
              <code>IRYS_GRAPHQL_ENDPOINT</code>.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

