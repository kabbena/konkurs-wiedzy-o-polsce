# Wyprawa po Polsce 🇵🇱

Gra-quiz na telefon dla dzieci z klas 1–3, przygotowująca do **Konkursu wiedzy o Polsce**.

**Zagraj:** https://kabbena.github.io/konkurs-wiedzy-o-polsce/

## Co jest w grze
- Na początku rodzic wpisuje imię dziecka i wybiera chłopiec/dziewczynka (poprawne formy: „skończyłeś/skończyłaś”, „Mistrz/Mistrzyni”). Imię można zmienić w panelu rodzica.
- **3 poziomy trudności** (🥉 🥈 🥇). Każdy ma te same 7 przystanków zgodnych z zakresem konkursu: Symbole, Mapa Polski, Legendy i historia, Wybitni Polacy, Tradycje, Przyroda, Ważne miejsca + **Wielki Finał** (10 pytań) z dyplomem. Poziom 2 i 3 otwierają się po Wielkim Finale poprzedniego poziomu.
- 308 pytań (poziom 1: 114, poziom 2: 100, poziom 3: 94) w 6 formach: obrazki, Tak/Nie, dotknij na mapie Polski, mapa Europy, połącz w pary, ułóż po kolei.
- Karty „Poznaj” przed pierwszą rundą każdego przystanku.
- Lektor po kliknięciu 🔊 (głos polski z telefonu).
- Rundy po 5 pytań, bez zegara i bez „żyć”. Po błędzie podpowiedź i druga próba; pytania z błędem wracają.
- Postęp zapisuje się automatycznie w przeglądarce telefonu – gra wraca dokładnie tam, gdzie dziecko skończyło.
- Panel rodzica (link „Dla rodzica” na mapie, zabezpieczony mnożeniem): postępy, pytania do powtórki, dźwięki, odblokowanie, reset.
- Przycisk „🔄 Nowa gra” na dole mapy: usuwa imię i wszystkie postępy (po potwierdzeniu mnożeniem przez rodzica).

## Pliki
- `index.html` – gotowa gra (jeden plik, działa też offline po zapisaniu).
- `src/` – źródła (pytania: poziom 1 w `src/data.js`, poziomy 2–3 w `src/data2.js`), `tools/build.py` składa je w `index.html`.
- `tools/validate.js` – kontrola danych, `tools/sweep.js` – sprawdza, czy każde pytanie mieści się na małym ekranie, `tools/test.js` – automatyczne przejście całej gry (Playwright, Pixel 7 i iPhone SE).

Kontury map: dane Natural Earth (domena publiczna) przez github.com/datasets/geo-countries.
