# Sound Rocket

A phonics game for a beginning reader. Open it at **https://rgupta42-del.github.io/sound-rocket/** (on an iPad: Share → Add to Home Screen).

## What's in it
Three planets follow the Montessori reading series:
- **Moon Base (pink):** letter sounds and 3-letter words (cat, pig, sun)
- **Mars (blue):** 4- and 5-letter words with blends (frog, drum, plant). Opens after 20 Moon words.
- **Saturn (green):** sh, ch, th, ck, ee, oo, ng (ship, duck, sheep, spoon). Opens after 15 Mars words.

Activities:
- **Sound Cards:** Montessori three-period lesson: "This is…", "Show me…", "What is this?"
- **Trace It:** sandpaper-letter tracing while saying the sound
- **I Spy:** pick the picture that starts with a sound
- **Blend It:** sound out a word tile by tile, with a grown-up checking
- **Build a Word:** movable alphabet; wrong letters play their own sound (control of error)
- **Read & Match:** read a word alone and pick its picture
- **Tricky Words:** sight words that can't be sounded out
- **Storybook:** seven decodable stories with tap-a-word help and a picture question at the end

Practice is chosen by spaced repetition: nothing repeats back-to-back, missed items come back sooner, mastered ones less often, and new letter sounds are introduced in Montessori order a couple at a time.

The **Progress** page shows stars and minutes per day for two weeks, a daily goal of 20 stars, streaks, which letter sounds he knows, words mastered per planet, stories read, and items that need more practice. Progress is stored on the device (browser storage).

## Files
- `index.html`, `css/style.css`, `js/*.js`: the game (no build step)
- `js/data.js`: word lists, stories and prompts
- `audio/`: recorded clips for every sound, word, sentence and prompt
- `tools/`: scripts that rebuild the audio (`node tools/export_list.js`, then `python3 tools/build_audio.py <voice dir>`)

Voice: Piper TTS "lessac" voice. Held sounds (mmm, sss) are made by lengthening the sound inside the voice model, and stop sounds are clipped short (b, not buh).
