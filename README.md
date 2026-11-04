# Wyprawa po Polsce 🇵🇱

Gra-quiz na telefon dla Gniewka (1. klasa), przygotowująca do **Konkursu wiedzy o Polsce**.

**Zagraj:** https://kabbena.github.io/konkurs-wiedzy-o-polsce/

## Co jest w grze
- 7 przystanków zgodnych z zakresem konkursu: Symbole, Mapa Polski, Legendy i historia, Wybitni Polacy, Tradycje, Przyroda, Ważne miejsca + **Wielki Finał** (10 pytań ze wszystkiego) z dyplomem.
- 114 pytań w 6 formach: obrazki, Tak/Nie, dotknij na mapie Polski, mapa Europy, połącz w pary, ułóż po kolei.
- Karty „Poznaj” przed pierwszą rundą każdego przystanku.
- Lektor po kliknięciu 🔊 (głos polski z telefonu).
- Rundy po 5 pytań, bez zegara i bez „żyć”. Po błędzie podpowiedź i druga próba; pytania z błędem wracają.
- Postęp zapisuje się automatycznie w przeglądarce telefonu – gra wraca dokładnie tam, gdzie dziecko skończyło.
- Panel rodzica (link „Dla rodzica” na mapie, zabezpieczony mnożeniem): postępy, pytania do powtórki, dźwięki, odblokowanie, reset.

## Pliki
- `index.html` – gotowa gra (jeden plik, działa też offline po zapisaniu).
- `src/` – źródła (treść pytań w `src/data.js`), `tools/build.py` składa je w `index.html`.
- `tools/validate.js` – kontrola danych, `tools/test.js` – automatyczne przejście całej gry (Playwright, Pixel 7 i iPhone SE).

Kontury map: dane Natural Earth (domena publiczna) przez github.com/datasets/geo-countries.
