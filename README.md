# Sound Rocket

A reading, math and geography game from Pre-K to 5th grade. Open it at **https://rgupta42-del.github.io/Sound-rocket/** (on an iPhone or iPad: Share → Add to Home Screen).

## For families
Share the link with anyone. Each family's progress stays on their own phone or tablet; nothing is sent anywhere.
- **A player per child:** the first visit asks for the child's name, a picture, and which grade to start reading, math and geography at (any grade from Pre-K to 5th; earlier grades stay open for review). Add more children from the home screen and switch between them.
- **Grown-ups area** (tap 👪 at the bottom of the home screen): **This week** shows minutes, rounds finished, accuracy, streak, what the child needs help with and what they finished, with per-subject details below; **🔓 Unlock everything** at the top opens every planet and lesson in one tap; **Settings** moves the child to any grade, opens every planet or a single lesson, renames, backs up and restores, starts over or removes; **Help** has the tips, a sound check and a share button.
- **For children:** the card marked **▶ Next** (it glows) is the next unfinished activity, so there's always an obvious thing to play. The rocket at the top fills with today's stars: 20 completes the daily mission and it blasts off, every 20 after that is a bonus blast-off, and 🔥 shows the streak. Big moments get a celebration: mission complete, a new planet, an activity checked off, a 3-star round and streaks of 3, 7, 14, 30 days and more. Everything opens with one tap, and every question is read out loud, so children who can't read yet can still play.

## What's in it
Reading, Math and Geography share seven planets, one per grade. Switch subjects with the 📖 Reading / 🔢 Math / 🌍 Geography tabs on the home screen; each subject unlocks its planets separately, and stars, the rocket (today's mission) and the streak are shared.

| Planet | Grade | Reading | Math | Geography |
|---|---|---|---|---|
| Moon | Pre-K | Letter sounds | Number cards 0–10, counting, more or less, shapes, patterns | Land or water, places in town, weather, above/below |
| Mars | K | 3-letter words (cat, pig, sun) | Numbers to 20, add and take away within 10, make ten | Land and water maps, seasons, left/right, home to country |
| Jupiter | 1st | Blends and sh, ch, th, ck, ee, oo, ng | Facts within 20, tens and ones, greater/less, hour and half hour | 7 continents, 5 oceans, compass, map symbols |
| Saturn | 2nd | Long vowels (magic e, ai, oa, igh) and bossy r | 2-digit add/subtract, hundreds, skip counting, even/odd, coins, time to 5 min | Find continents, landforms, where animals live |
| Uranus | 3rd | Syllables, compound words, endings | Times tables, division facts, fractions, rounding, area, 3-digit add/subtract | US states on the map, flags, countries and continents, compass rose |
| Neptune | 4th | Prefixes and suffixes | Multi-digit multiply, remainders, equivalent fractions, decimals, place value, factors | State capitals, US regions, find the states, land and water words |
| Pluto | 5th | Greek and Latin roots | Fraction and decimal operations, 2-digit multiply/divide, order of operations, volume | World capitals, countries on the map, latitude and hemispheres, climate zones |

**Rounds:** every activity is played in short rounds: 10 questions (6 on Pre-K and K, fewer if the activity has fewer different questions), with no repeats inside a round and dots at the top showing how many are left. A round ends with a results screen: up to 3 stars (90% right = ★★★, 70% = ★★, 50% = ★), then Play again, Next activity or Home. Activity cards show their best stars, and ★★ or better checks an activity off ✓. Replays only give bonus stars when they beat the best score. Storybook earns a star per story read on that planet.

**Planets** open when about 70% of the activities on the one before are checked off. The home screen's **Next planet** bar shows how many are done, and **❓ How to play** explains the game (it opens on its own the first time a player is set up). A grown-up can unlock any grade on the Progress page.

Reading activities:
- **Sound Cards:** Montessori three-period lesson: "This is…", "Show me…", then "Which picture starts with this sound?"
- **Rhyme Time, Clap It, Sound Boxes, Last Sound:** listening games (rhymes, syllables, counting the sounds in a word with Elkonin boxes, ending sounds) that build the phonemic awareness reading rests on
- **Trace It:** sandpaper-letter tracing while saying the sound
- **I Spy:** pick the picture that starts with a sound
- **Blend It / Chunk It:** sound out a word tile by tile (or chunk by chunk from 3rd grade), by picking its picture; a "Sound it out for me" button models the blending
- **Build a Word:** movable alphabet, or syllable tiles from 3rd grade; wrong tiles play their own sound (control of error)
- **Read & Match:** read a word alone and pick its picture
- **❤️ Heart Words:** sight words by grade, Pre-K to 3rd; the letters that don't follow the rules are marked with a heart and the rest is sounded out
- **Word Meaning:** read a word and pick its meaning (3rd to 5th)
- **Storybook:** fifteen stories from decodable K stories to 5th-grade passages, with tap-a-word help and a question at the end

Math activities include Number Cards (three-period lesson), Quick Look (dice and ten frames flashed for a moment), Number Bonds, Number Line, Trace Numbers (sandpaper numerals), golden beads for place value, ten frames, clocks, coins, fraction pictures, area grids and a number pad. After two misses the answer is shown and the problem comes back sooner.

Practice is chosen by spaced repetition: nothing repeats back-to-back, missed items come back sooner, mastered ones less often, and new items (letter sounds in Montessori order, math facts from easiest) come in a couple at a time.

The grown-ups area shows stars and minutes per day for two weeks (split into reading and math), a daily goal of 20 stars, streaks, which letter sounds he knows, words mastered per grade, stories read, math progress per grade, and items that need more practice. Progress is stored on the device (browser storage), separately for each child; progress from the earlier three-planet version carries over (Moon Base words count as K, Mars and Saturn as 1st grade).

## Files
- `index.html`, `css/style.css`, `js/*.js`: the game (no build step)
- `js/data.js`: grades, word lists, stories and prompts for reading
- `js/math.js`: math skills for each grade and the pictures they draw
- `js/geo.js`: geography skills for each grade; `js/geo-maps.js`: world and US map outlines, generated by `tools/build_geo.js` from Natural Earth and US Census data
- `audio/`: recorded clips for every sound, word, sentence, number and prompt
- `tools/`: scripts that rebuild the audio (`node tools/export_list.js`, then `python3 tools/build_audio.py <voice dir>`; only missing clips are built unless you pass `--force`)

Voice: Kokoro TTS "af_heart" voice. Letter sounds are cut from clearly spoken words (/θ/ from "thin", /iː/ from "seat"): held sounds (mmm, sss, eee) loop their steady middle, and stop sounds are clipped short (b, not buh). Numbers are joined from recorded parts (forty-seven, thousand, three, hundred…).
