import Head from "next/head";
import { useMemo, useState } from "react";

const exampleAddress = "0x3F20EBe6AB8CCdf07a77bFbF16530d30B2504E12";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);

  const isValidEvm = useMemo(
    () => /^0x[a-fA-F0-9]{40}$/.test(wallet.trim() || ""),
    [wallet]
  );

  const handleCheck = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    if (!isValidEvm) {
      setErrorMsg("Invalid EVM address. Expected 0x followed by 40 hex characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/irys?wallet=${encodeURIComponent(wallet.trim())}`);
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
          content="Paste your EVM wallet to see uploaded files on Irys (Devnet by default). Open each item via the public gateway."
        />
      </Head>

      {/* Page */}
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
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
        </header>

        {/* Main */}
        <main className="max-w-2xl mx-auto px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              Irys Storage Upload Checker
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Paste your EVM wallet to see uploaded files.
            </p>
          </div>

          {/* Search Card */}
          <form
            onSubmit={handleCheck}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5"
          >
            <label htmlFor="wallet" className="block text-sm font-medium mb-2">
              EVM Wallet Address
            </label>

            <div className="flex gap-2">
              <input
                id="wallet"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck="false"
                placeholder={exampleAddress}
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-0 px-4 py-2 text-sm bg-white"
                aria-invalid={!isValidEvm && wallet.length > 0}
              />

              <button
                type="submit"
                disabled={loading || !isValidEvm}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-gray-900 text-white disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Checking…
                  </span>
                ) : (
                  "Check"
                )}
              </button>
            </div>

            {/* Inline helper / validation */}
            <div className="mt-2 min-h-[1.5rem]">
              {!isValidEvm && wallet.length > 0 ? (
                <span className="inline-flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1">
                  Invalid address
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  Gateway: <code>https://gateway.irys.xyz/&lt;id&gt;</code>
                </span>
              )}
            </div>

            {/* Global error */}
            {errorMsg && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {errorMsg}
                </span>
              </div>
            )}
          </form>

          {/* Results */}
          <section
            className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-5"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold">Result</h2>
              {result ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-800 rounded-full px-2 py-1">
                    Total: {result.total}
                  </span>
                  {result.partial && (
                    <span className="inline-flex items-center text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-1">
                      partial
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">No query yet</span>
              )}
            </div>

            {/* Content */}
            <div className="mt-4">
              {!result ? (
                <p className="text-sm text-gray-500">
                  Enter a wallet and click <strong>Check</strong> to see uploads.
                </p>
              ) : result?.urls?.length > 0 ? (
                <ul className="space-y-2">
                  {result.ids.map((id, i) => (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 hover:border-gray-200 px-3 py-2"
                    >
                      <code className="text-xs break-all bg-gray-50 rounded px-2 py-1">
                        {id}
                      </code>
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
                <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-700 rounded-full px-2 py-1">
                  No uploads found
                </span>
              )}
            </div>
          </section>

          {/* CTA EasyNode */}
          <aside className="mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-900 font-medium">Want to go further?</p>
                <p className="text-xs text-gray-500">Deploy or buy nodes in minutes.</p>
              </div>
              <a
                href="https://app.easy-node.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:opacity-95"
              >
                Deploy or buy a node with EasyNode →
              </a>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
