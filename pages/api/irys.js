/**
 * API route: GET /api/irys?wallet=<address>
 *            POST /api/irys  { wallet: "0x..." }
 *
 * Répond: { total, ids: [..], urls: [..], partial: boolean }
 */

const DEFAULT_ENDPOINT = "https://arweave.devnet.irys.xyz/graphql";
const GATEWAY_BASE = "https://gateway.irys.xyz/";
const LIMIT = 100;
const MAX_ITERATIONS = 200;

const QUERY = `
query list($owners:[String!]!,$limit:Int,$after:String){
  transactions(owners:$owners, limit:$limit, order: DESC, after:$after){
    edges{
      node{ id }
      cursor
    }
  }
}
`;

function isValidEvm(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test((addr || "").trim());
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const endpoint = process.env.IRYS_GRAPHQL_ENDPOINT || DEFAULT_ENDPOINT;

    const wallet =
      req.method === "GET" ? (req.query.wallet || "").trim() : (req.body?.wallet || "").trim();

    if (!isValidEvm(wallet)) {
      return res.status(400).json({
        error:
          "Adresse EVM invalide. Format attendu: 0x + 40 caractères hexadécimaux (ex: 0xabc...123).",
      });
    }

    let after = null;
    let total = 0;
    const ids = [];
    const seenCursors = new Set();
    let partial = false;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const body = {
        query: QUERY,
        variables: {
          owners: [wallet],
          limit: LIMIT,
          after,
        },
      };

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({
          error: "GraphQL endpoint returned a non-OK response.",
          status: resp.status,
          details: text?.slice(0, 1024),
        });
      }

      const json = await resp.json();

      if (json.errors?.length) {
        return res.status(502).json({
          error: "GraphQL errors returned by endpoint.",
          details: json.errors,
        });
      }

      const edges = json?.data?.transactions?.edges || [];
      if (!Array.isArray(edges) || edges.length === 0) {
        break; // plus de résultats
      }

      for (const edge of edges) {
        const id = edge?.node?.id;
        if (id) {
          ids.push(id);
        }
      }

      total += edges.length;

      const lastCursor = edges[edges.length - 1]?.cursor || null;
      if (!lastCursor) break;

      // Protection contre boucles avec le même cursor
      if (seenCursors.has(lastCursor)) {
        partial = true;
        break;
      }
      seenCursors.add(lastCursor);

      after = lastCursor;
    }

    // Si on a dépassé l'itération max, indiquer que c'est partiel
    if (ids.length >= LIMIT * MAX_ITERATIONS) {
      partial = true;
    }

    const urls = ids.map((id) => `${GATEWAY_BASE}${id}`);

    // Réponse finale
    // (total == ids.length dans ce flux, mais on renvoie les deux explicitement)
    return res.status(200).json({ total: ids.length, ids, urls, partial });
  } catch (err) {
    return res.status(500).json({
      error: "Server error.",
      details: err?.message?.slice(0, 1024),
    });
  }
}

