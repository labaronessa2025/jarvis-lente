// Saluto di Jarvis all'apertura di ogni web app degli occhiali (regola di Raffaele: ogni web app è Jarvis).
// Riquadro HUD con la frase per 3,5 s e voce di Jarvis (audio sulla funzione Supabase jarvis-lente, protetto dalla chiave).
// Uso: JarvisSaluto({ app: "prezzi", chiave: K, url: URL_DATI, frasi: [{ audio: "prezzi-1", scritta: "…" }, …] })
// - frase scelta a caso, mai la stessa due volte di seguito;
// - riaperture della stessa app entro 15 minuti: solo la scritta, niente voce;
// - se gli occhiali bloccano l'audio senza un gesto, parte al primo comando della Neural Band (entro 15 s).
(function () {
  "use strict";
  const stile = document.createElement("style");
  stile.textContent = `
    #jarvis-saluto { position:absolute; left:22px; right:22px; top:150px; padding:16px 18px; background:#000; border:1px solid #3fd4ff55;
      font:600 22px/1.3 "SF Pro Display", -apple-system, Roboto, Arial, sans-serif; color:#3fd4ff; text-shadow:0 0 10px #3fd4ff55;
      opacity:0; transform:translateY(8px); transition:opacity .4s, transform .4s; pointer-events:none; z-index:5; }
    #jarvis-saluto.visibile { opacity:1; transform:none; }
    #jarvis-saluto small { display:block; margin-top:6px; font:12px/1.4 "SF Mono", "Roboto Mono", Menlo, monospace; letter-spacing:3px; color:#8fb3c4; text-shadow:none; }`;
  document.head.appendChild(stile);

  const leggi = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const scrivi = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  window.JarvisSaluto = async function ({ app, chiave, url, frasi, sotto = "SISTEMI ONLINE" }) {
    if (!frasi || !frasi.length) return;
    const ultima = leggi("saluto-ultima-" + app);
    const scelte = frasi.length > 1 ? frasi.filter(f => f.audio !== ultima) : frasi;
    const frase = scelte[Math.floor(Math.random() * scelte.length)];

    const box = document.createElement("div");
    box.id = "jarvis-saluto";
    box.setAttribute("aria-live", "polite");
    box.textContent = frase.scritta;
    const riga = document.createElement("small");
    riga.textContent = sotto;
    box.appendChild(riga);
    (document.getElementById("app") || document.body).appendChild(box);
    // Il timer parte quando il riquadro compare davvero: se il primo disegno tarda, il saluto non resta fisso sullo schermo.
    requestAnimationFrame(() => { box.classList.add("visibile"); setTimeout(() => box.classList.remove("visibile"), 3500); });

    if (!chiave || Date.now() - (+leggi("saluto-ora-" + app) || 0) < 15 * 60 * 1000) return;
    try {
      const r = await fetch(url + "?audio=saluto-" + frase.audio, { headers: { "x-lente-key": chiave }, cache: "no-store" });
      if (!r.ok) return;
      const voce = new Audio(URL.createObjectURL(await r.blob()));
      const parla = () => voce.play().then(() => {
        scrivi("saluto-ora-" + app, String(Date.now()));
        scrivi("saluto-ultima-" + app, frase.audio);
      });
      parla().catch(() => {
        const alPrimoGesto = () => { document.removeEventListener("keydown", alPrimoGesto, true); parla().catch(() => {}); };
        document.addEventListener("keydown", alPrimoGesto, true);
        setTimeout(() => document.removeEventListener("keydown", alPrimoGesto, true), 15000);
      });
    } catch (e) {}
  };
})();
