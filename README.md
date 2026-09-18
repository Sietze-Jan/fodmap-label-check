# FODMAP Label Check

Point your iPhone at an ingredient list, get a green / amber / red verdict plus
a breakdown of exactly which ingredients drove each colour.

Built for grocery shopping in Geneva, so it reads **French, German, Italian and
English** ingredient lists — including the trilingual panels on Migros and Coop
packaging. The interface is in English.

It works by reading the **ingredient list text**, not by looking up a barcode.
That is deliberate: Migros private labels (M-Budget, Anna's Best, Alnatura) are
mostly missing from barcode databases, and reading the label works on any
product in any country, including cross-border shops in Ferney-Voltaire or
Annemasse.

No API keys, no accounts, no per-scan costs, no network calls. All the analysis
happens on the phone.

---

## How it works

```
iOS Shortcut                          This web page
┌──────────────────────────┐          ┌────────────────────────────┐
│ 1. Take Photo            │          │ reads text from #t=...     │
│ 2. Extract Text from     │  ──────▶ │ matches ingredients.js     │
│    Image  (Apple OCR)    │   URL    │ renders the traffic light  │
│ 3. URL Encode            │ fragment │                            │
│ 4. Open URL  .../#t=...  │          │                            │
└──────────────────────────┘          └────────────────────────────┘
```

Apple's built-in **Extract Text from Image** does the OCR. It is free, runs
on-device, needs no OCR service, and is far better than anything a browser can
do on 6-point type printed on shiny curved plastic.

The text travels in the URL **fragment** (`#t=...`), never the query string.
Fragments are not sent to the server, so label text never leaves the phone even
though the page is hosted publicly.

---

## Adding an ingredient

**This is the part you will actually come back to.** Accuracy lives entirely in
`js/ingredients.js`. You should never need to touch the matching code.

Open `js/ingredients.js`, find the section that fits, and add one line:

```js
{ pattern: 'sirop de datte', level: 'red', group: 'sweetener',
  label: 'Date syrup', reason: 'Excess fructose' },
```

| Field | Required | What it does |
| --- | --- | --- |
| `pattern` | yes | The text as printed on the label. Write it naturally, with accents and hyphens. |
| `level` | yes | `'red'`, `'yellow'` or `'green'`. |
| `label` | yes | Short English name shown in the results. |
| `reason` | red/yellow | One short line, ~10 words max. |
| `group` | no | Tag for the suppression system, e.g. `'lactose'`. |
| `alwaysFlag` | no | `true` survives the "less than 2%" downgrade. |
| `wholeWord` | no | Defaults to `true`. Set `false` for German. |
| `suppresses` | no | Array of `group` tags this entry cancels. |

### The two rules worth knowing

**1. Write patterns naturally.** Everything is normalised the same way before
matching, so `'Sirop de Glucose-Fructose'` and `'sirop de glucose/fructose'`
both work. Accents, apostrophes, hyphens and capitals are all handled.

**2. Longest pattern wins, and consumes the text.** Entries are sorted by
length and once a stretch of text is matched, nothing else can match it. That
resolves collisions automatically:

- `pomme de terre` (potato, green) beats `pomme` (apple, red)
- `poireau` (leek) beats `poire` (pear)
- `sirop de glucose-fructose` (red) beats `sirop de glucose` (green)
- `Milchsäure` (lactic acid) beats `Milch`
- `Zwiebelpulver` beats `Zwiebel`

**So to fix a false positive, add the longer, more specific term with the right
level.** You do not need to change any logic.

### French vs German matching

French and Italian use **whole-word** matching with optional plurals on every
word — this is what stops `ail` (garlic) from matching inside *travail*,
*détail* or *volaille*, while still catching `pommes de terre` where French puts
the plural on the head noun.

German uses **substring** matching (`wholeWord: false`) on purpose, because
compounding means `Zwiebel` should also match inside `Zwiebelpulver`.

### After editing

```bash
node test/test.js
```

Then bump `CACHE_VERSION` in `sw.js` — otherwise phones keep serving the old
cached copy and your change will not appear. This is the most common
"why isn't my edit live?" cause.

---

## Running the tests

```bash
node test/test.js       # or: npm test
```

No test framework and no dependencies, so it will still run in three months
without an `npm install` that has gone stale. 37 tests covering normalisation,
the 2% rule, every collision case, the suppression rules, multilingual labels,
and the safety behaviour.

If you add a tricky ingredient, add a test for it. The pattern is:

```js
test('what it checks', 'Ingrédients: ...', (r, t) => {
  t.verdict(r, 'red');
  t.flagged(r, 'red', 'Onion powder');
  t.notFlagged(r, 'Apple');
});
```

## Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A plain static server is all it needs — there is no build step.

---

## Deploying to GitHub Pages

GitHub Pages on a free account requires a **public** repo. That is fine here:
the page contains no API keys, no credentials and no personal data, and label
text stays in the URL fragment, which is never transmitted.

```bash
gh auth login                                    # not yet authenticated
gh repo create fodmap-label-check --public --source=. --push
gh api -X POST repos/:owner/fodmap-label-check/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

Or without the CLI: create a public repo on github.com, then

```bash
git remote add origin git@github.com:<you>/fodmap-label-check.git
git push -u origin main
```

and in the repo: **Settings → Pages → Source: deploy from branch `main`, root**.

Your URL will be `https://<you>.github.io/fodmap-label-check/`. It takes a
minute or two to go live the first time.

To publish changes later: `git push`, then bump `CACHE_VERSION` in `sw.js`.

---

## Building the iOS Shortcut

On her iPhone, open **Shortcuts** → **+** → **Add Action**, and build this:

1. **Take Photo**
   Search "Take Photo". Tap the arrow to expand it and set **Camera** to *Back*.
   Turn **Show Camera Preview** *on* so she can frame the label.

2. **Extract Text from Image**
   Search "Extract Text". It should automatically take *Photos* from step 1 as
   its input. This is Apple's on-device OCR — no account, works offline.

3. **URL Encode**
   Search "URL Encode". Set its input to the **Text** from step 2.

4. **Open URLs**
   Search "Open URLs". Set the URL to your Pages address followed by `#t=` and
   the encoded text:

   ```
   https://<you>.github.io/fodmap-label-check/#t=[URL Encoded Text]
   ```

   Type the URL up to `#t=`, then tap the variable chip and pick the **URL
   Encoded Text** output from step 3.

Then rename it to **FODMAP** and give it the traffic-light icon.

### Putting it somewhere she'll actually reach

- **Home screen:** in the Shortcut's details (ⓘ) → **Add to Home Screen**.
- **Action Button** (iPhone 15 Pro and later): Settings → Action Button → scroll
  to **Shortcut** → pick FODMAP. One squeeze from the lock screen.
- **Back Tap:** Settings → Accessibility → Touch → Back Tap → Double Tap → FODMAP.

### Without the Shortcut

The page works on its own. Tap the text box, long-press, and choose **Scan
Text** to read the label with the camera using iOS's built-in OCR.

---

## File layout

```
index.html               markup only
css/styles.css           mobile-first, dark, high contrast
js/ingredients.js        ← THE INGREDIENT TABLE. Edit this one.
js/analyse.js            normalisation + matching. Pure, no DOM, testable.
js/render.js             the only file that touches the DOM
js/app.js                wiring: reads #t=, calls analyse, calls render
test/test.js             plain-node test suite, no dependencies
sw.js                    offline cache — bump CACHE_VERSION when you edit
manifest.webmanifest     home-screen metadata
icons/                   generated traffic-light PNGs
```

The split matters: `analyse.js` has no DOM access, which is why the tests can
import it directly under `node` with no jsdom and no bundler.

---

## What it does and does not do

**Four buckets, not three.** Red, amber, green, and **Not recognised**. An
ingredient the table does not know about is never silently treated as safe —
that is the one failure mode that would actually be dangerous.

**A grey "can't read it" state.** If the text has no ingredient-list header and
fewer than three comma-separated tokens, it refuses to show a colour at all. A
false green from a bad photo is worse than no answer.

**The "less than 2%" rule.** Ingredients listed after *moins de 2%* /
*weniger als 2%* / *meno del 2%* are downgraded one level — except **garlic,
onion, chicory and inulin**, which stay red at any amount because they trigger
symptoms in quantities small enough that the rule does not protect you.

**Allergen advisories are ignored.** "Peut contenir des traces de blé" is a
cross-contamination notice; traces are irrelevant for FODMAPs.

**Aged cheeses suppress the milk flag.** Gruyère legitimately lists *lait*, but
the lactose is gone. This matters constantly on Swiss labels.

---

## Accuracy caveats — please read these

**Monash holds the only authoritative data.** Monash University lab-tests foods
at specific serving sizes. That dataset is licensed and is not in this tool, not
in Open Food Facts, and not in any language model. Everything here is
pattern-matching against ingredient *names*. Buy the official
[Monash FODMAP app](https://www.monashfodmap.com/ibs-central/i-have-ibs/get-the-app/)
(available in French) and use it whenever this tool says amber.

**Amber is about portion, not presence.** It means "this contains something
whose FODMAP load depends on how much you eat". The answer is not printed on the
label, so the tool cannot resolve it. Amber means *go and check the serving size
in Monash* — that is the workflow, not a failure.

**Recipes change.** Scan the actual ingredient list each time rather than
trusting a remembered verdict.

**This is a shopping aid, not a medical guarantee.** It is for reducing the
twenty-minute stall in the cereal aisle. A dietitian outranks all of it.

### Worth installing alongside

- **[Monash FODMAP](https://www.monashfodmap.com/ibs-central/i-have-ibs/get-the-app/)**
  — the authoritative serving sizes. Available in French.
- **Fodmap Facile** (App Store, French) — barcode plus photo analysis, a useful
  second opinion.

Skip **Fig** (US-only) and **Spoonful** (US, Canada, UK, Australia and New
Zealand only). Neither covers Switzerland.
