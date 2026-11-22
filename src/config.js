/* =====================================================================
   Birthday Surprise: Configuration
   Everything you want to personalise lives in CONFIG below.
   ===================================================================== */

export const CONFIG = {
  /* INSERT NAME HERE (e.g. 'Sam' or 'Sammy') */
  name: 'Sam',
  fullName: '',

  /* INSERT YOUR NAME HERE (used to sign the letter) */
  from: 'Andre',

  songs: [
    {
      id: 'happy-birthday-piano',
      src: 'assets/audio/happy-birthday-piano.m4a',
      volume: 0.72,
      title: 'Happy Birthday (Piano)',
      artist: 'Benote · Piano Instrumental',
      cover: 'assets/images/IMG_20260901_230952_379.jpg',
      linerNotes:
        'A soft piano Happy Birthday to kick off your special day, Sammy. Make a wish and take a breather today! 🎹🎂✨',
      modalNote:
        'Thought starting your birthday card with a warm piano Happy Birthday would set the nicest vibe while you blow out your candle. Switch to Track 02 anytime for the throwback energy! 🎹✨',
      tags: ['🎂 Birthday Piano', '🎹 Warm & Cozy', '💖 Track 01 · For Sam'],
    },
    {
      id: 'baby-remix',
      src: 'assets/audio/song.mp3',
      volume: 0.7,
      title: 'Baby (Remix)',
      artist: 'Justin Bieber',
      cover: 'assets/images/IMG_20260901_233255_746.jpg',
      linerNotes:
        'Had to put this song on here for you, Sammy. Hope it gets stuck in your head today and makes you smile. Happy birthday! 🎶✨',
      modalNote:
        'Fun fact: this throwback still had to stay on here. Play it loud while you celebrate today, future RN — you deserve a super chill, happy birthday! 🎧🩺✨',
      tags: ['✨ Birthday Vibes', '🎶 Throwback Classic', '💖 Track 02 · For Sam'],
    },
  ],

  song: {
    /* Primary track alias + fallback lullaby metadata */
    src: 'assets/audio/happy-birthday-piano.m4a',
    volume: 0.72,
    title: 'Happy Birthday (Piano)',
    artist: 'Benote · Piano Instrumental',
    cover: 'assets/images/IMG_20260901_230952_379.jpg',
    linerNotes:
      'A soft piano Happy Birthday to kick off your special day, Sammy. Make a wish and take a breather today! 🎹🎂✨',
    modalNote:
      'Thought starting your birthday card with a warm piano Happy Birthday would set the nicest vibe while you blow out your candle. Switch to Track 02 anytime for the throwback energy! 🎹✨',

    /* Shown on the player only if the song file can't be loaded */
    fallbackTitle: 'Stardust Lullaby',
    fallbackArtist: 'a little music box, made for you',
  },

  /* INSERT VOUCHER PRIZE HERE */
  voucher: {
    prize: 'Birthday Treat (Ice Cream, Cake, Coffee, Fries, or any Food) on Me 🍨🍰🍟',
    fine: 'No expiry · Claim anytime · Future RN 🩺✨',
  },

  /* INSERT MEMORY IMAGES HERE
     Photos of Samantha Nicole in public/assets/images/
     `caption` = front of the polaroid · `back` = message revealed on flip. */
  memories: [
    {
      id: 'snap-1',
      src: 'assets/images/IMG_20260901_230952_379.jpg',
      caption: 'prettiest ✨',
      back: 'Pretty kaayo oych 🌸 happy birthday, Sammy!',
      date: 'snap 01',
      tilt: '-3deg',
      pin: '#ff7fb5',
    },
    {
      id: 'snap-2',
      src: 'assets/images/IMG_20260901_233255_746.jpg',
      caption: 'golden hour 💛',
      back: 'Golden hour really suits you, Sam ✨',
      date: 'snap 02',
      tilt: '2.5deg',
      pin: '#b18cff',
    },
    {
      id: 'snap-3',
      src: 'assets/images/IMG_20260902_003828_384.jpg',
      caption: 'goofy side 🥸',
      back: 'HAHAHA',
      date: 'snap 03',
      tilt: '-2.5deg',
      pin: '#7fd4ff',
    },
  ],

  /* INSERT LETTER HERE (line breaks are kept exactly as written) */
  letter: `Oych Sammy,

Happy birthday! 🎂✨

Crazy how it’s already been around three months since we met, bitaw. I know where things stand between us, so yeah hahaha, I just genuinely wanted to make something nice for your birthday because I really appreciate having known you and how fun every random conversation with you has been.

I truly wish you nothing but the best this year, Sam. Keep pushing toward your dream of becoming a nurse. I know you’re going to make such a caring, amazing RN someday. 🩺✨

Hope today treats you well, enjoy lots of good food, and have the happiest birthday!

Amping always, Sammy!
{from}`,

  /* QR CODE SETTINGS (formed in a Birthday Cake & Heart that she can scan) */
  qr: {
    /* Live GitHub Pages URL encoded into the Birthday Cake & Heart QR code */
    url: 'https://andr3licious.github.io/happy-birthday-sammy/',
    secretMessage:
      'Oych Sammy, you found the hidden note diaych! 🎂💖 Wishing our future RN the happiest birthday and the brightest year ahead. Amping always, Sam!',
    littleCorner: {
      title: 'A Little Corner of the Web',
      emoji: '🌸',
      url: 'https://andr3licious.github.io/for-sammy/',
      note: "Whenever you're feeling down, scan this or tap below to visit a little corner I made for you.",
    },
  },
};
