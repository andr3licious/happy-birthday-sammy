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

  song: {
    /* INSERT SONG URL HERE: drop an .mp3 into public/assets/audio/ and point to it.
       If the file is missing or fails to load, a soft built-in music-box
       lullaby plays instead, so the page never goes silent or breaks. */
    src: 'assets/audio/song.mp3',
    volume: 0.7,

    /* INSERT SONG TITLE / ARTIST HERE */
    title: 'Baby (Remix)',
    artist: 'Justin Bieber',

    /* Optional album-art for the vinyl label. Leave '' to use the first memory photo. */
    cover: 'assets/images/IMG_20260901_233255_746.jpg',

    /* INSERT WHY YOU CHOSE THE SONG HERE */
    linerNotes:
      'Had to put this song on here for you, Sammy. Hope it gets stuck in your head today and makes you smile. Happy birthday! 🎶✨',

    /* Shown on the player only if the song file can't be loaded */
    fallbackTitle: 'Stardust Lullaby',
    fallbackArtist: 'a little music box, made for you',
  },

  /* INSERT VOUCHER PRIZE HERE */
  voucher: {
    prize: 'Birthday Treat (Ice Cream, Cake, Coffee, Fries, or any Food) on Me 🍨🍟',
    fine: 'No expiry · Claim anytime · Future RN privilege 🩺✨',
  },

  /* INSERT MEMORY IMAGES HERE
     Photos of Samantha Nicole in public/assets/images/
     `caption` = front of the polaroid · `back` = message revealed on flip. */
  memories: [
    {
      id: 'snap-1',
      src: 'assets/images/IMG_20260901_230952_379.jpg',
      caption: 'prettiest ✨',
      back: 'Pretty kaayo uy 🌸 happy birthday, Sammy!',
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

Crazy how it’s already been around three months since we met, bitaw. I know where things stand between us, so no heavy speeches or anything (botbota HAHAHAHA), I just genuinely wanted to make something nice for your birthday because I really appreciate having known you and how fun every random conversation with you has been.

I truly wish you nothing but the best this year, Sam. Keep pushing toward your dream of becoming a nurse. I know you’re going to make such a caring, amazing RN someday. 🩺✨

Hope today treats you well, enjoy lots of good food, and have the happiest birthday!

Amping always, Sammy!
{from}`,

  /* QR CODE SETTINGS (formed in a Birthday Cake & Heart that she can scan) */
  qr: {
    /* Live GitHub Pages URL encoded into the Birthday Cake & Heart QR code */
    url: 'https://andr3licious.github.io/happy-birthday-sammy/',
    secretMessage:
      'Oych Sammy, you found the hidden note diaych! 🎂💖 Wishing our future RN the happiest birthday and the brightest year ahead. Amping always, Sam! - Andre ✨',
  },
};
