/*
  Protocollo Terapista — configurazione della landing.
  Tutti i valori che possono cambiare stanno qui. Le istruzioni sono in LEGGIMI.md.
  I campi vuoti ("") sono quelli che mancano ancora.
*/
window.PT_CONFIG = {
  /* Modulo della diagnosi
     FORM_ENDPOINT: URL che riceve le richieste in POST con corpo JSON.
     FORM_CONTENT_TYPE: lascia "application/json". Se il servizio che riceve
     blocca la richiesta per CORS, prova "text/plain": il corpo resta JSON. */
  FORM_ENDPOINT: "",
  FORM_CONTENT_TYPE: "application/json",
  /* true solo nelle anteprime: il modulo mostra la conferma senza inviare nulla. */
  FORM_DEMO: false,

  /* Tracciamento: si attiva solo con il consenso del visitatore. */
  META_PIXEL_ID: "",
  GA4_ID: "",

  /* Video di presentazione (VSL) nella hero.
     Con VSL_SRC vuoto la hero mostra la scheda diagnosi. */
  VSL_SRC: "",
  VSL_POSTER: "",

  /* Reel nel telefono (sezione «Come lavoriamo»). */
  REEL_SRC: "assets/video/reel-720.mp4",
  REEL_POSTER: "assets/img/reel-poster.webp",

  /* Casi studio: con false (o senza casi completi in casi-studio.json) la
     sezione resta nella versione «in costruzione»; con true e almeno un caso
     completo mostra i casi veri. */
  SHOW_CASE_STUDIES: false,

  /* Foto dei soci (4:5). Vuote = card indaco con l'iniziale. */
  FOTO_SOCI: {
    andrea: "",
    cristiano: "",
    lorenzo: ""
  },

  /* Link e dati legali per footer, modulo e banner cookie. */
  INSTAGRAM_URL: "https://www.instagram.com/protocolloterapista/",
  PRIVACY_URL: "",
  COOKIE_URL: "",
  INTESTAZIONE_LEGALE: "",
  PARTITA_IVA: "",
  EMAIL_CONTATTO: ""
};
