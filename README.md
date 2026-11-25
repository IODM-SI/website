# IODM 0.3

Razvojni osnutek vsebuje sedem specifikacij in belo knjigo. Register je neaktiven.

## Specifikacije

[Repozitorij specifikacij](https://github.com/IODM-SI/specification) je vključen kot Gitov podmodul `standards/`.
Izvorne datoteke so v `standards/source/`, različice PDF za objavo pa v `standards/pdf/`.
Za ponovno izdelavo PDF-jev uporabite `./build.sh` s Typst CLI 0.15 ali novejšim in pisavo DejaVu Sans. Imena PDF-jev izhajajo iz identifikatorja in različice v glavi datoteke Typst.

Pred objavo potrdite AID, politiko PKI, testne vektorje in izvedite fizične preskuse.

## Spletna stran (Eleventy + Tailwind CSS)

Zahteva Node.js 20 ali novejši. V korenu projekta:

```sh
git submodule update --init
npm ci
npm run dev
npm run build
```

Razvojni strežnik je na http://localhost:8080. Eleventy kopira PDF-je na naslove pod `/standard/`. Lokalno uporabite `./build.sh`, če pripeta revizija vsebuje novejše specifikacije od priloženih PDF-jev.

Podatki za strani so v `site/_data/`, skupne predloge pa v `site/_includes/`. Eleventy ob vsaki gradnji zažene Tailwind CLI, ki iz predlog in datoteke `site/assets/site.css` izdela lokalni slogovni list. Barvna shema sledi sistemski nastavitvi svetlega ali temnega načina. Register je predstavitveni in ne objavlja podpisanega manifesta. Datoteka `issuers.json` ostane prazna do potrditve izdajateljev.

## GitHub Actions

Po potisku na `main` potek za GitHub Pages iz pripete revizije izdela PDF-je,
zgradi Eleventy in objavi `_site/`. V nastavitvah Pages izberite vir
**GitHub Actions**. Za preverjanje gradnje brez objave ročno zaženite potek
z izklopljeno možnostjo `deploy`.

Ob novi izdaji specifikacij se sproži potek **Update the specification submodule**.
Preveri oznako Git, izdela PDF-je in odpre PR z novo revizijo podmodula ter
posodobljenimi povezavami v katalogu.

Za povezavo med potekoma in samodejni PR nastavite naslednji skrivnosti
GitHub Actions.

| Repozitorij | Skrivnost | Dostop žetona |
|---|---|---|
| `specification` | `WEBSITE_RELEASE_TOKEN` | `website`, Actions (write) |
| `website` | `WEBSITE_PR_TOKEN` | `website`, Contents (write) in Pull requests (write) |
