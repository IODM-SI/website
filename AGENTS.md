# IODM — project handoff and agent instructions

## 1. Mission and current state

IODM means **Interoperabilni dostopni medij**. The owner controls `iodm.si`. Build a publicly documented, vendor-independent profile for cryptographically authenticated physical access credentials, together with independent card/reader conformity assessment and a federated issuer trust registry. The public website and specifications are in Slovenian. Code and developer documentation may be in English. Prefer precise, neutral technical language; distinguish mandatory requirements (MORA / NE SME), recommendations (NAJ) and options (LAHKO).

The project began with `IODM-v0.3-webawesome.zip`, extracted as `iodm-webawesome/`. This is a development draft, not an adopted national/ISO standard, accredited certification scheme or deployed trust service. No issuers, products or partnerships have been confirmed. Do not invent endorsements, certification results, registry entries, contact addresses or live services. The owner requested Tailwind CSS with system light and dark modes, and separate card and reader certification documents.

## 2. Repository and build

| Path | Role |
|---|---|
| `standards/` | Git submodule pinned to a commit of `IODM-SI/specification` |
| `standards/source/{template,standard,card,reader,issuer,trust,identity,manifest,whitepaper}.typ` | Shared Typst template and eight publication sources |
| `build.sh` | Runs the submodule's Typst build |
| `standards/pdf/` | Locally generated PDFs copied to `_site/standard/` |
| `site/index.njk` | Slovenian landing page |
| `site/standard/index.njk` | Document catalog |
| `site/trust/index.njk` | Human-readable issuer register |
| `site/_includes/{base,nav,footer,documents}.njk` | Shared layout/components |
| `site/_data/{site,documents,features,steps,issuers}.json` | Central site data; issuers currently empty |
| `site/assets/site.css` | Tailwind CSS input, theme, and shared styles |
| `eleventy.config.js`, `package.json` | Eleventy build and dependencies |

The site uses Eleventy 3.0.0, Nunjucks, ESM configuration, Node >=20 and Tailwind CSS 4.3.3. Eleventy runs the local Tailwind CLI on build and rebuild. It compiles `site/assets/site.css` and scans the Nunjucks templates to generate `_site/assets/site.css`. Use semantic HTML and follow `prefers-color-scheme` for light and dark modes.

```sh
git submodule update --init
npm ci
./build.sh           # Requires Typst CLI 0.15+ and DejaVu Sans
npm run build        # Outputs _site/
npm run dev          # Development server
```

GitHub Pages: the website workflow uses Node 22 and builds the PDFs from the pinned specification source before compiling and uploading `_site`. Run `./build.sh` before building the site locally. The specification workflow uploads generated PDFs for PRs and attaches them to tagged GitHub Releases, then dispatches the website workflow to open a PR for the submodule pin and catalog changes. See the README for repository-scoped Actions credentials.

## 3. Publication structure

| ID | Source basename | Scope |
|---|---|---|
| IODM-001 | standard | Normative card interface, APDU, X.509 leaf profile, cryptography, interoperability |
| IODM-002 | card | Card/medium conformity assessment; M-01–M-25 |
| IODM-003 | reader | Reader and verification backend conformity; B-01–B-37 |
| IODM-004 | issuer | Issuer eligibility, CA profile, CP/CPS, key custody, issuance and revocation; ISS-01–10 |
| IODM-005 | trust | Signed issuer registry, trust distribution, rollback protection; TR-01–08 |
| IODM-006 | identity | IODM-ID and PACS/SKD integration; ID-01–07 |
| IODM-007 | manifest | Signed batch enrollment manifests; MF-01–08 |
| IODM-WP-001 | whitepaper | Informative rationale and ecosystem positioning, not normative |

Keep IODM-001 the single authority for on-card wire format and leaf certificate profile; refer to it instead of creating divergent copies. IODM-004 owns CA rules, 005 registry wire format, 006 ID lifecycle/backend integration, 007 batch manifest. Keep test identifiers stable and add traceability to individual normative requirements. Version documents, templates, examples, data, download names and protocol versions deliberately (document v0.3 is not wire protocol v01). Add a changelog and compatibility policy. Typst is the canonical publication source. The parallel Markdown drafts have been retired.

## 4. Baseline wire protocol (do not change casually)

- ISO/IEC 14443-4 transport and ISO/IEC 7816-4 interindustry APDUs; basic logical channel, short APDUs required. No proprietary DESFire commands or issuer SDK required for ordinary authentication.
- Proposed private DF name `F041434345535301` (not a confirmed production allocation); EF certificate `0101`, optional intermediate chain `0102`, authentication key reference `00`.
- Certificate EF: DER X.509 from offset zero, no three-byte DUOX length prefix, maximum 4096 B, optional zero padding. Chain EF: concatenated intermediate DER certs nearest issuer first, no root or padding, max 8192 B. Clarify deterministic chain discovery/length termination in next revision.
- Select and read using explicit nonzero Le <=240, avoiding differing Le=00 semantics. Parse bounded canonical DER length before allocation.

```text
C: 00 A4 04 0C 08 F0 41 43 43 45 53 53 01
R: 90 00
C: 00 A4 02 0C 02 01 01
R: 90 00
C: 00 B0 00 00 04
R: 30 82 01 65 90 00     (illustrative 361-byte cert)
C: 00 B0 00 04 F0
R: [240 bytes] 90 00
C: 00 B0 00 F4 75
R: [117 bytes] 90 00
```

Authentication (sample nonces only):

```text
C: 00 88 00 00 1F
   80 09 F0 41 43 43 45 53 53 01 01
   7C 12 81 10
   A1 B2 C3 D4 E5 F6 07 18 29 3A 4B 5C 6D 7E 8F 90
   56
R: 7C 54 81 10
   11 22 33 44 55 66 77 88 99 AA BB CC DD EE FF 00
   82 40 [r:32 bytes] [s:32 bytes]
   90 00
```

`M = F0 F0 || OptsA_TLV || RndB || RndA`; ECDSA P-256/SHA-256, hash exactly once; signature raw unsigned big-endian `r||s`, fixed 64 bytes. Response data length 86, plus SW. OptsA includes tag/length; only nonce values are signed. Reader nonce fresh for every attempt; independent card nonce. Strict TLV order and bounds; check r,s in valid range. Baseline reader requires exact OptsA; DUOX may accept other options and sign them unchanged. Card authentication proves possession, does not establish a secure channel or mutual authentication. Default factory Priv.PICC is not enabled for unilateral authentication; provision a dedicated application key with correct policy. Do not confuse NXP originality/PICC certificates with IODM leaf certs. DUOX is one implementation candidate, not a dependency; independently implementable on Java Card and other suitable secure platforms.

## 5. Normative X.509 and identity baseline

IODM-ID is 48 bits, `IID (16) || MID (32)`, network byte order. Text: exactly 12 uppercase hexadecimal characters. IID 0000/FFFF and MID 00000000/FFFFFFFF reserved. IODM assigns IID, issuer assigns MID without reuse across physical media. Example `000100001234`.

**The ID MUST be inside the signed certificate**, in subject DN containing exactly one RDN and one attribute `serialNumber` OID `2.5.4.5`, ASN.1 PrintableString (tag 13 hex). Do not use certificate-level serialNumber as media ID, do not invent a custom OID without approval, and do not use RF UID. Example subject DER `30 17 31 15 30 13 06 03 55 04 05 13 0C 30 30 30 31 30 30 30 30 31 32 33 34`. Renewal keeps media ID but changes certificate serial; replacement physical media gets new MID.

Leaf: X.509 v3 DER, RFC 5280/5480, positive CA-unique cert serial <=20 octets, nonempty issuer DN, UTC validity coding per RFC 5280; ECDSA-SHA256 OID 1.2.840.10045.4.3.2 (parameters absent, inner and outer IDs equal), SPKI id-ecPublicKey 1.2.840.10045.2.1 with namedCurve P-256 1.2.840.10045.3.1.7, uncompressed valid point `04||X||Y`, zero unused bits; no unique IDs. Certificate ECDSA signature is DER SEQUENCE, unlike APDU raw signature.

| Extension | Requirement |
|---|---|
| basicConstraints 2.5.29.19 | Critical, CA false, no pathLen |
| keyUsage 2.5.29.15 | Critical, digitalSignature only |
| SKI 2.5.29.14 | Noncritical, RFC 5280 method 1 |
| AKI 2.5.29.35 | Noncritical, keyIdentifier matches issuer SKI |
| CRL DP 2.5.29.31 | Noncritical, at least one HTTPS full CRL URI |
| AIA 1.3.6.1.5.5.7.1.1 | Optional noncritical |
| EKU / SAN | Absent in base profile |

Other noncritical extensions restricted to no personal/conflicting identity data; reject unknown critical or duplicate extensions. Leaf maximum validity 10 years, CA max 25 years (draft policy choices, not external mandates). Verify chain, time, revocation and profile, including IID binding to active registered CA, then challenge response; only then release authenticated IODM-ID. CA and leaf profiles must remain consistent. Authentication is not authorization.

## 6. Federation and lifecycle

- Issuers own their CA hierarchies; IODM manages trust registry, not necessarily a universal root CA. CA keys dedicated to IODM, HSM/equivalent protection, root preferably offline. P-256 CA with critical CA basicConstraints and keyCertSign/cRLSign only; at most one intermediate (root pathLen <=1, direct issuing CA pathLen=0). All CA path members registered to same IID; no shared anchors across IID. Registry approval max one year; CRL issued at least daily, nextUpdate <=48 hours, prompt incident response. These are draft limits to review with owner.
- Registry `/trust/v1/manifest.json`, detached DER CMS `/trust/v1/manifest.p7s`, CA DER under `/trust/v1/ca/`. JSON UTF-8, no BOM/duplicate or unknown fields, schemaVersion=1, increasing sequenceNumber <=2^53-1, issuedAt/nextUpdate UTC RFC3339, issuers array. IID four uppercase hex; hashes 64 uppercase hex SHA-256 over DER. Each issuer includes name, status, validity, securityContact and certificates with certificateId, role, status, URL, sha256. Roles trustAnchor/intermediate/manifestSigner; statuses active/suspended/withdrawn/expired. See trust.typ for complete baseline.
- Detached CMS SignedData, eContentType id-data, absent eContent, single signer P-256/SHA-256, signedAttrs content-type and message-digest, sign exact JSON bytes via CMS rules. Registry signer key installed independently, not trusted merely because embedded or delivered via HTTPS. Atomic update, persistent sequence high-water mark, identical bytes only for repeated sequence. Daily publish, max seven-day validity. Reject expired trust or stale revocation information; offline operation only while local trust and revocation data are valid. Never automatically trust web PKI, URLs from untrusted certs or card-supplied roots.
- Batch manifests use same CMS shape but separate registered active manifestSigner for same IID, UUID manifestId, issuedAt/expiresAt, credentials array with iodmId/formFactor/profile/certificateSha256; max 10 MiB/10000 entries/30 days. Idempotent import, reject conflicts, no secret keys or personal data. Enrollment never grants rights or substitutes live proof of possession.
- PACS/SKD decides access; authenticated and integrity-protected reader-to-controller transport, e.g. OSDP Secure Channel. Wiegand alone is not secure. Use collision-free local mapping for limited-bit legacy panels, never truncate/modulo. Do not claim secure proximity or relay resistance from challenge-response alone.

## 7. Work plan and acceptance criteria

### P0 — establish a reproducible baseline
- [ ] Install dependencies and Typst, compile all eight PDFs, render and inspect each page (tables, code blocks, headings, Slovenian diacritics).
- [ ] Build Eleventy from clean checkout, verify the local Tailwind stylesheet in light and dark modes, and test navigation, responsive layout, keyboard access, contrast, all PDF links and absence of browser console errors.
- [ ] Add CI (clean install, Typst compile, Eleventy build, link validation), update README and lock versions. No fallback PDF should be described as Typst output.

### P1 — make the protocol implementable and testable
- [ ] Resolve AID allocation before public stable release. Audit all APDU lengths/status words against source and actual DUOX/Java Card test cards; define optional chain EF discovery and EOF semantics, short-read behavior, handling 61xx/6Cxx and bounded retry rules.
- [ ] Generate **synthetic test-only** CA, intermediate, leaf, signed registry and batch manifests, APDU transcript with real signature and known verification outputs. Include deterministic or recorded vectors and negative mutations. Never use real private keys or label test CAs as approved.
- [ ] Provide machine-readable JSON Schemas, certificate lint tooling and a small reference reader/verifier; validate strict DER types (including PrintableString), required extension criticality, CA/IID binding, malformed lengths, duplicate keys, rollback, time/CRL expiry, replay and fail-closed paths.
- [ ] Resolve remaining registry/CA edge cases: CA certificate entry validity versus issuer validity, revocation of trust anchor vs descendants, signer rotation/recovery, OCSP/CRL freshness and network/cache constraints, manifest signer policy, cert renewal conflicts. Clearly define time source and resource limits. Review whether dedicated EKU/policy OID is needed; no silent protocol change.
- [ ] Conduct cross-vendor matrix testing with at least two independent card/platform implementations and independent readers; record configurations, firmware, test artifacts and results. Current physical tests have not been done.

### P2 — evolve conformity and governance
- [ ] Expand IODM-002 and 003 separately into executable tests: preconditions, input, steps, expected result, evidence, applicable requirements, mandatory vs optional, pass/fail rules, retest and certificate scope/version. Do not imply accredited certification without evidence.
- [ ] Document issuer approval/renewal/suspension, product certification lifecycle, change control, complaints, incident handling, disclosure and public register policy. Establish transparent eligibility not dependent on chip brand or bilateral commercial agreement.
- [ ] Ask owner to approve stable normative values, licensing terms, AID, registry governance and approval authorities before release; keep draft label until then.

### P3 — public website and ecosystem
- [ ] Improve homepage with clear value proposition: different media/vendors, one protocol; unique per-medium key; public PKI trust registry; offline-capable verification subject to freshness; independent authentication and authorization. Keep public messaging concise, accurate, Slovenian.
- [ ] Add data-driven pages `/certification/cards/`, `/certification/readers/`, `/issuers/`, `/products/`, `/developers/`, `/whitepapers/`, `/security/`, `/changelog/` as needed; preserve existing `/standard/`, `/trust/`. Reuse shared Nunjucks components and keep Tailwind CSS local.
- [ ] Add version/date/status metadata for downloads, accessible HTML summaries, archive old versions, SHA-256 checksums and source download where owner approves. Use actual links only; no fake active registry or badges.
- [ ] Implement registry publication pipeline only when trust signing/issuer approval process is defined. `issuers.json` remains empty until approved; test fixtures isolated from production output. Do not embed production signing keys in repository or CI logs.

## 8. Reference material and claims

Owner supplied NXP `duox.pdf`, MF3E(H)x3 rev 1.2 (10 July 2025), marked confidential: sections 7.5.7 (unilateral auth), 8.2.3 (APDU), 7.17.3.4 and 8.12.1–2 (ISO selection/read). Use only if legitimately available to the agent; do not publish or bundle the confidential datasheet. IODM should be independently implementable from its own public specs. Owner supplied LEAF Verified whitepaper (February 2026) as inspiration for explaining PKI, separation of chip/product/ecosystem, federated IDs, bulk enrollment, complementary mobile credentials. Do not copy its visual branding or imply affiliation, compatibility, chip-level partnerships or certification. Aliro is a separate protocol; shared cryptographic primitives do not imply wire compatibility. References include ISO/IEC 14443, 7816-4, 9798-3, 8825-1; RFC 5280, 5480, 5652, 8259, 3647, 9562; FIPS 186-5, 180-4; NIST SP 800-186. Verify exact editions and claims before publication. Do not distribute the reference PDFs without permission.

## 9. Agent working rules

Read existing sources before editing. Preserve owner decisions (Slovenian, platform independence, X.509-bound MID, separate reader/card certification, public CA registry, Typst, Eleventy/Nunjucks/Tailwind CSS). For each change, update impacted normative references, tests, generated PDFs and website data; report what was changed, built, tested, what remains uncertain and any proposed normative decisions. Do not claim tests or deployment not actually performed. Favor incremental, reviewable commits and explicit decisions over speculative rewrites. No secrets in public repository. Treat all limits and identifiers in the current draft as proposed baseline, not final approved policy. This handoff records current implementation and priorities; it is not itself a normative specification.
