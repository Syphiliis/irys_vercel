import { useState } from "react";

const exampleAddress = "0x3F20EBe6AB8CCdf07a77bFbF16530d30B2504E12"; // exemple

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
      setErrorMsg("Adresse EVM invalide. Format attendu: 0x + 40 caractères hexadécimaux.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/irys?wallet=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data?.error || "Erreur inconnue côté serveur.");
      }
      setResult(data);
    } catch (err) {
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Irys Uploads Checker</h1>
          <p className="text-sm text-gray-600 mt-1">
            Entrez une adresse EVM, puis cliquez sur <span className="font-semibold">Check</span> pour
            lister les uploads (Devnet par défaut).
          </p>
        </header>

        <form onSubmit={handleCheck} className="space-y-3 bg-white p-4 rounded-2xl shadow">
          <label htmlFor="wallet" className="block text-sm font-medium">
            Adresse (wallet) EVM
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
              <h2 className="text-lg font-semibold">Résultat</h2>
              <span className="text-sm text-gray-600">
                Total: <span className="font-semibold">{result.total}</span>
                {result.partial ? (
                  <em className="ml-2 text-amber-600">(partiel: limite atteinte)</em>
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
                      Open in gateway
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 mt-3">Aucun upload trouvé.</p>
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
  );
}

